# Supabase → AWS Migration - Infrastructure Analysis

**SPEC_ID:** SUPABASE-AWS-MIGRATION-INFRASTRUCTURE  
**STATUS:** Analysis Complete  
**OWNER:** CTO  
**DEPENDENCIES:** requirements.md, design.md, tasks.md  

## 1. Supabase Current State Analysis

### Database Schema Inventory
```sql
-- CORE TABLES IDENTIFIED (61 total)
-- Based on analysis of supabase/sql/matbakh_complete_schema.sql

-- Authentication & Users (3 tables)
├── profiles (id, email, role, display_name, avatar_url)
├── private_profiles (user_id, first_name, last_name, phone, address)
└── user_roles (user_id, role, permissions) -- RBAC system

-- Business Management (8 tables)
├── businesses (id, owner_id, name, address, opening_hours, social_links)
├── business_partners (30 columns) -- Main business data
├── business_profiles (61 columns) -- Restaurant profiles
├── business_contact_data (20 columns) -- Contact information
├── partner_kpis (15 columns) -- Business metrics
├── partner_bookings (19 columns) -- Commerce transactions
├── service_packages (15 columns) -- Product catalog
└── addon_services (18 columns) -- Additional services

-- Visibility Check System (12 tables)
├── vc_leads (61 columns) -- Email-based entry point
├── visibility_check_leads (61 columns) -- Main VC data
├── visibility_check_results (15 columns) -- Analysis results
├── visibility_check_actions (11 columns) -- Recommendations
├── visibility_trends (6 columns) -- Trend analysis
├── competitive_analysis (11 columns) -- Competitor data
├── swot_analysis (10 columns) -- SWOT analysis
├── platform_recommendations (13 columns) -- Platform tips
├── ai_recommendations (14 columns) -- AI suggestions
├── industry_benchmarks (11 columns) -- Industry data
├── unclaimed_business_profiles (25 columns) -- Unclaimed businesses
└── gmb_categories (21 columns) -- Google Business categories

-- Analytics & Events (15 tables)
├── lead_events (12 columns) -- Event tracking
├── oauth_event_logs (12 columns) -- Auth events
├── security_events (8 columns) -- Security logs
├── security_audit_log (10 columns) -- Audit trail
├── ga4_daily (16 columns) -- Analytics data
├── admin_booking_kpis (4 columns) -- Admin dashboards
├── admin_booking_metrics_by_month (4 columns)
├── admin_booking_revenue_analytics (9 columns)
├── user_consent_tracking (10 columns) -- GDPR compliance
├── category_search_logs (7 columns) -- Search tracking
├── category_tag_events (10 columns) -- Category events
├── matching_performance (9 columns) -- Algorithm performance
├── restaurant_analytics (10 columns) -- Restaurant metrics
├── user_shares (14 columns) -- Social sharing
└── waitlist (16 columns) -- Waitlist management

-- External Integrations (10 tables)
├── google_oauth_tokens (16 columns) -- Google OAuth
├── facebook_oauth_tokens (11 columns) -- Facebook OAuth
├── gmb_data_cache (16 columns) -- Google Business cache
├── facebook_data_cache (16 columns) -- Facebook cache
├── google_job_queue (10 columns) -- Background jobs
├── gmb_profiles (17 columns) -- GMB snapshots
├── fb_conversion_logs (11 columns) -- Facebook conversions
├── fb_conversions_config (7 columns) -- FB config
├── facebook_webhook_events (11 columns) -- FB webhooks
└── alerts (8 columns) -- System alerts

-- Content & Recommendations (8 tables)
├── consultation_requests (14 columns) -- Consultation booking
├── promo_codes (16 columns) -- Promotional codes
├── promo_code_usage (4 columns) -- Usage tracking
├── notes (6 columns) -- User notes
├── recipes (17 columns) -- Recipe management
├── meal_plans (9 columns) -- Meal planning
├── meals (10 columns) -- Individual meals
└── nutrition_logs (17 columns) -- Nutrition tracking
```

### RLS Policies Analysis
```sql
-- CRITICAL RLS POLICIES (from rbac_production_final.sql)

-- User Profile Access
CREATE POLICY "Users can read own profile" ON profiles
    FOR SELECT USING (id = auth.uid());

CREATE POLICY "Admins can read all profiles" ON profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles p2 
            WHERE p2.id = auth.uid() 
            AND p2.role IN ('admin', 'super_admin')
        )
    );

-- Business Data Access
CREATE POLICY "Owners can access own business" ON businesses
    FOR ALL USING (owner_id = auth.uid());

CREATE POLICY "Partners can access assigned businesses" ON businesses
    FOR SELECT USING (
        id IN (
            SELECT business_id FROM business_assignments 
            WHERE user_id = auth.uid()
        )
    );

-- VC Data Access
CREATE POLICY "Users can access own VC results" ON visibility_check_results
    FOR SELECT USING (
        business_profile_id IN (
            SELECT id FROM businesses WHERE owner_id = auth.uid()
        )
    );

-- Admin Access
CREATE POLICY "Admins can access all data" ON visibility_check_leads
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );
```

### Migration Complexity Assessment
```yaml
High Complexity Tables (Require Special Handling):
  - visibility_check_leads: 61 columns, JSONB fields, large volume
  - business_profiles: 61 columns, complex relationships
  - business_partners: 30 columns, commerce data
  - gmb_categories: Hierarchical data, foreign keys

Medium Complexity Tables:
  - All OAuth token tables: Encryption requirements
  - Analytics tables: Time-series data, partitioning needed
  - Cache tables: TTL requirements, Redis migration

Low Complexity Tables:
  - Static reference data (categories, packages)
  - Simple lookup tables
  - Configuration tables

Data Volume Estimates:
  - Total Records: ~500,000 rows
  - Storage: ~2GB (with indexes ~5GB)
  - Growth Rate: 50,000 new rows/month
  - Peak Load: 1,000 concurrent users
```

## 2. AWS IAM & Secrets Current State

### Existing AWS Infrastructure
```json
// Current S3 Bucket (from github-web-deploy-policy.json)
{
  "S3Bucket": "matbakhvcstack-webbucket12880f5b-svct6cxfbip5",
  "CloudFrontDistribution": "E2W4JULEW8BXSD",
  "Region": "eu-central-1",
  "Purpose": "Static website hosting"
}

// Current IAM Policies
{
  "GitHubDeployRole": {
    "Permissions": [
      "s3:ListBucket",
      "s3:PutObject", 
      "s3:GetObject",
      "s3:DeleteObject",
      "cloudfront:CreateInvalidation"
    ],
    "Resources": [
      "arn:aws:s3:::matbakhvcstack-webbucket12880f5b-svct6cxfbip5",
      "arn:aws:cloudfront::*:distribution/E2W4JULEW8BXSD"
    ]
  }
}
```

### Required IAM Roles for Migration
```yaml
# Lambda Execution Role
LambdaExecutionRole:
  ManagedPolicies:
    - AWSLambdaVPCAccessExecutionRole
    - AWSLambdaBasicExecutionRole
  CustomPolicies:
    - RDSAccess:
        Actions:
          - rds-db:connect
        Resources:
          - arn:aws:rds-db:eu-central-1:ACCOUNT:dbuser:matbakh-prod/lambda_user
    - SecretsManagerAccess:
        Actions:
          - secretsmanager:GetSecretValue
        Resources:
          - arn:aws:secretsmanager:eu-central-1:ACCOUNT:secret:matbakh/*
    - ElastiCacheAccess:
        Actions:
          - elasticache:DescribeCacheClusters
        Resources: "*"

# DMS Replication Role
DMSReplicationRole:
  ManagedPolicies:
    - AmazonDMSVPCManagementRole
    - AmazonDMSCloudWatchLogsRole
  CustomPolicies:
    - SourceDatabaseAccess:
        Actions:
          - rds:DescribeDBInstances
          - rds:DescribeDBClusters
        Resources: "*"

# Glue ETL Role
GlueETLRole:
  ManagedPolicies:
    - AWSGlueServiceRole
  CustomPolicies:
    - S3DataLakeAccess:
        Actions:
          - s3:GetObject
          - s3:PutObject
          - s3:DeleteObject
          - s3:ListBucket
        Resources:
          - arn:aws:s3:::matbakh-data-lake-prod
          - arn:aws:s3:::matbakh-data-lake-prod/*
    - RDSReadAccess:
        Actions:
          - rds:DescribeDBInstances
          - rds-data:ExecuteStatement
        Resources: "*"

# Cognito Lambda Trigger Role
CognitoTriggerRole:
  ManagedPolicies:
    - AWSLambdaBasicExecutionRole
  CustomPolicies:
    - CognitoAccess:
        Actions:
          - cognito-idp:AdminGetUser
          - cognito-idp:AdminUpdateUserAttributes
        Resources:
          - arn:aws:cognito-idp:eu-central-1:ACCOUNT:userpool/eu-central-1_*
```

### Secrets Management Strategy
```yaml
# AWS Secrets Manager Structure
Secrets:
  matbakh/database/credentials:
    SecretString:
      username: matbakh_app
      password: "{{auto-generated}}"
      engine: postgres
      host: matbakh-prod.cluster-xyz.eu-central-1.rds.amazonaws.com
      port: 5432
      dbname: matbakh
    KmsKeyId: alias/matbakh-rds-key
    
  matbakh/external-apis/google:
    SecretString:
      client_id: "1012096096241-isdu4et7pm3777du2ucnhem9aohvbu1j.apps.googleusercontent.com"
      client_secret: "{{migrate-from-env}}"
      oauth_redirect_uri: "https://api.matbakh.app/auth/google/callback"
    KmsKeyId: alias/matbakh-lambda-key
    
  matbakh/external-apis/facebook:
    SecretString:
      app_id: "{{migrate-from-env}}"
      app_secret: "{{migrate-from-env}}"
      webhook_verify_token: "{{auto-generated}}"
    KmsKeyId: alias/matbakh-lambda-key
    
  matbakh/external-apis/aws-bedrock:
    SecretString:
      access_key_id: "{{migrate-from-env}}"
      secret_access_key: "{{migrate-from-env}}"
      region: "eu-central-1"
      model_id: "anthropic.claude-3-5-sonnet-20240620-v1:0"
    KmsKeyId: alias/matbakh-lambda-key

# Migration from .env to Secrets Manager
CurrentSecrets:
  - GOOGLE_CLIENT_SECRET: "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"
  - FACEBOOK_APP_SECRET: "93319702fc0d4f2f901debdc23cbfdaacda281f4cfcd7f3669489eaa5a21ac27"
  - AWS_BEDROCK_ACCESS_KEY_ID: "<REDACTED_AWS_ACCESS_KEY_ID>"
  - AWS_BEDROCK_SECRET_ACCESS_KEY: "<REDACTED_AWS_SECRET_ACCESS_KEY>"
  - SUPABASE_SERVICE_ROLE_KEY: "{{will-be-deprecated}}"
```

## 3. Monitoring & Testing Infrastructure

### Existing Health Checks
```bash
# VC Healthcheck Script (scripts/vc_healthcheck.sh)
# Tests CDN behavior and cache consistency
#!/usr/bin/env bash
check() {
  curl -sI --globoff "$1" | awk 'BEGIN{IGNORECASE=1} /^HTTP|^etag:|^cache-control:|^content-type:|^x-cache:|^x-amz-cf-/{print}'
}

A="$(check 'https://matbakh.app/vc/result?t=abc')"
B="$(check 'https://matbakh.app/vc/result?e=invalid')"

# Validates ETag and Cache-Control consistency
[ "$ETAG_A" = "$ETAG_B" ] && [ "$CC_A" = "$CC_B" ] \
  && echo "VC Healthcheck: PASS" || { echo "VC Healthcheck: FAIL"; exit 1; }
```

### Required AWS Monitoring Setup
```yaml
# CloudWatch Dashboards
Dashboards:
  ApplicationHealth:
    Widgets:
      - API Gateway Metrics (Latency, Errors, Throttles)
      - Lambda Function Metrics (Duration, Errors, Concurrent Executions)
      - RDS Cluster Metrics (CPU, Connections, Read/Write Latency)
      - ElastiCache Metrics (CPU, Memory, Hit Rate)
      - Custom Business Metrics (VC Completions, User Registrations)
      
  InfrastructureHealth:
    Widgets:
      - VPC Flow Logs Analysis
      - NAT Gateway Metrics
      - Load Balancer Health Checks
      - S3 Request Metrics
      - CloudFront Cache Hit Ratio

# CloudWatch Alarms
Alarms:
  Critical:
    - APIGateway5XXErrors > 5% for 2 periods
    - RDSCPUUtilization > 80% for 3 periods
    - LambdaErrors > 10 for 2 periods
    - DatabaseConnections > 80% of max
    
  Warning:
    - APIGatewayLatency > 1000ms for 3 periods
    - ElastiCacheCPU > 70% for 5 periods
    - S3RequestErrors > 1% for 2 periods
    
  Business:
    - VCCompletionRate < 80% for 5 periods
    - UserRegistrationRate < 10/hour for 2 periods
    - PaymentFailureRate > 5% for 3 periods

# X-Ray Tracing
TracingConfig:
  SamplingRate: 0.1  # 10% of requests
  Services:
    - API Gateway
    - Lambda Functions
    - RDS (via Lambda)
    - External API calls
  CustomSegments:
    - Database queries
    - Cache operations
    - External API calls
    - Business logic execution
```

### Data Quality Monitoring
```python
# AWS Glue Data Quality Rules
data_quality_rules = {
    "business_partners": [
        "ColumnCount = 30",
        "IsComplete 'id'",
        "IsUnique 'id'",
        "ColumnValues 'status' in ['active', 'inactive', 'suspended']",
        "ColumnDataType 'created_at' = 'timestamp'",
        "RowCount > 1000"  # Minimum expected records
    ],
    
    "visibility_check_leads": [
        "ColumnCount = 61",
        "IsComplete 'email'",
        "IsUnique 'id'",
        "ColumnValues 'status' in ['pending', 'processing', 'completed', 'failed']",
        "ColumnDataType 'email' = 'string'",
        "RowCountMatch 'supabase_export' within 1%"
    ],
    
    "vc_results": [
        "IsComplete 'lead_id'",
        "ColumnValues 'overall_score' between 0 and 100",
        "ReferentialIntegrity 'lead_id' references 'visibility_check_leads.id'",
        "DataFreshness < 24 hours"
    ]
}

# Automated DQ Checks
def run_data_quality_checks():
    for table, rules in data_quality_rules.items():
        result = glue_client.start_data_quality_evaluation(
            DataSource={'GlueTable': {'DatabaseName': 'matbakh', 'TableName': table}},
            Role='arn:aws:iam::ACCOUNT:role/GlueDataQualityRole',
            RulesetNames=[f'{table}_quality_rules']
        )
        
        if result['ResultId']:
            # Monitor evaluation and alert on failures
            monitor_dq_evaluation(result['ResultId'], table)
```

### Migration Testing Framework
```yaml
# Pre-Migration Tests
PreMigrationTests:
  - Schema Validation:
      - Compare table structures
      - Validate foreign key relationships
      - Check index definitions
      - Verify constraint definitions
      
  - Data Validation:
      - Row count comparison
      - Checksum validation
      - Sample data verification
      - Referential integrity checks
      
  - Performance Baseline:
      - Query execution times
      - Connection pool performance
      - Cache hit rates
      - API response times

# During Migration Tests
MigrationTests:
  - CDC Validation:
      - Replication lag monitoring
      - Data consistency checks
      - Error rate monitoring
      - Throughput validation
      
  - Application Testing:
      - API endpoint validation
      - User authentication flow
      - Business logic verification
      - Error handling validation

# Post-Migration Tests
PostMigrationTests:
  - End-to-End Testing:
      - Complete user journeys
      - Payment processing
      - Email delivery
      - External API integrations
      
  - Performance Validation:
      - Load testing with production traffic
      - Database query performance
      - Cache effectiveness
      - API response times
      
  - Security Testing:
      - Authentication and authorization
      - Data encryption validation
      - Network security verification
      - Compliance checks
```

## 4. Migration Risk Assessment

### High-Risk Components
```yaml
CriticalRisks:
  DataLoss:
    Probability: Low
    Impact: Critical
    Mitigation:
      - Multiple backup strategies
      - Point-in-time recovery
      - Automated rollback procedures
      - Real-time data validation
      
  ExtendedDowntime:
    Probability: Medium
    Impact: High
    Mitigation:
      - Blue-green deployment
      - DNS-based traffic switching
      - Pre-warmed infrastructure
      - Automated health checks
      
  PerformanceDegradation:
    Probability: Medium
    Impact: Medium
    Mitigation:
      - Load testing before cutover
      - Auto-scaling policies
      - Performance monitoring
      - Rollback triggers
      
  SecurityBreach:
    Probability: Low
    Impact: Critical
    Mitigation:
      - Encryption at rest and in transit
      - Network segmentation
      - Access logging and monitoring
      - Security audit before go-live
```

### Rollback Procedures
```yaml
RollbackTriggers:
  - API error rate > 5% for 5 minutes
  - Database connection failures > 10% for 2 minutes
  - User authentication failure rate > 2% for 3 minutes
  - Payment processing failure rate > 1% for 1 minute

RollbackProcedure:
  1. Immediate DNS switch back to Supabase (< 2 minutes)
  2. Disable AWS Lambda functions
  3. Re-enable Supabase Edge Functions
  4. Validate Supabase system health
  5. Communicate incident to stakeholders
  6. Begin post-incident analysis

RecoveryTime:
  - DNS propagation: 2-5 minutes
  - Application recovery: 1-2 minutes
  - Full system validation: 5-10 minutes
  - Total RTO: < 15 minutes
```

## 5. Implementation Readiness

### Prerequisites Checklist
```yaml
Infrastructure:
  ✅ AWS Account with appropriate limits
  ✅ VPC and networking setup
  ✅ IAM roles and policies defined
  ✅ KMS keys for encryption
  ⏳ RDS cluster provisioning
  ⏳ ElastiCache cluster setup
  ⏳ Cognito User Pool configuration

Security:
  ✅ Secrets identified and catalogued
  ⏳ Secrets Manager setup
  ⏳ WAF rules configuration
  ⏳ Security group definitions
  ⏳ Network ACLs setup

Monitoring:
  ⏳ CloudWatch dashboards
  ⏳ Alarm configurations
  ⏳ X-Ray tracing setup
  ⏳ Log aggregation
  ⏳ Data quality monitoring

Testing:
  ✅ Health check scripts identified
  ⏳ Load testing framework
  ⏳ Data validation scripts
  ⏳ End-to-end test suites
  ⏳ Rollback procedures tested
```

### Next Steps
1. **Infrastructure Provisioning** (Week 1-2)
2. **Security Configuration** (Week 2-3)
3. **Monitoring Setup** (Week 3-4)
4. **Testing Framework** (Week 4-5)
5. **Migration Execution** (Week 6-8)

---

**STATUS:** Ready for infrastructure provisioning phase
**RISK LEVEL:** Medium (well-planned with comprehensive mitigation)
**ESTIMATED EFFORT:** 16 weeks total, 8 weeks critical path