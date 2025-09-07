# Supabase → AWS Migration Masterplan

**SPEC_ID:** SUPABASE-AWS-MIGRATION  
**STATUS:** Draft  
**OWNER:** CTO  
**PRIORITY:** P0 (Strategic)  
**TIMELINE:** 12-16 Wochen  

## 1. Executive Summary

### Vision
Migration der gesamten matbakh.app Datenbank von Supabase zu AWS für:
- **Skalierung:** 10x Wachstum (100k+ Restaurants)
- **Kostenoptimierung:** 60% Kosteneinsparung bei Scale
- **Compliance:** Enterprise-grade DSGVO/SOC2 Compliance
- **Performance:** Sub-100ms API Response Times
- **Vendor Independence:** Reduzierung der Supabase-Abhängigkeit

### Business Impact
- **Revenue:** Ermöglicht Enterprise-Kunden (€50k+ ARR)
- **Costs:** €2k/Monat → €800/Monat bei 10k Users
- **Risk:** Eliminiert Single-Point-of-Failure
- **Speed:** 3x schnellere Analytics-Queries

## 2. Current State Analysis

### Supabase Inventory (61 Tabellen)
```
Core Business Logic (15 Tabellen):
├── business_partners (30 Spalten) - Hauptgeschäftsdaten
├── business_profiles (61 Spalten) - Restaurant-Profile
├── visibility_check_leads (61 Spalten) - VC-System Kern
├── visibility_check_results (15 Spalten) - VC-Ergebnisse
├── partner_bookings (19 Spalten) - Commerce
├── service_packages (15 Spalten) - Produktkatalog
├── gmb_categories (21 Spalten) - Google Business Kategorien
└── user_preferences (16 Spalten) - Personalisierung

Analytics & Events (12 Tabellen):
├── lead_events (12 Spalten) - Event-Tracking
├── oauth_event_logs (12 Spalten) - Auth-Events
├── security_events (8 Spalten) - Security-Logs
├── ga4_daily (16 Spalten) - Analytics-Daten
└── visibility_trends (6 Spalten) - Trend-Analyse

Social & External (8 Tabellen):
├── google_oauth_tokens (16 Spalten) - OAuth-Tokens
├── facebook_oauth_tokens (11 Spalten) - Social-Auth
├── gmb_data_cache (16 Spalten) - Google-Cache
└── facebook_data_cache (16 Spalten) - Facebook-Cache

Admin & Operations (10 Tabellen):
├── admin_booking_kpis (4 Spalten) - Admin-Dashboards
├── security_audit_log (10 Spalten) - Audit-Trail
├── feature_flags (implizit) - Feature-Management
└── profiles/private_profile - RBAC-System

Content & Recommendations (16 Tabellen):
├── ai_recommendations (14 Spalten) - KI-Empfehlungen
├── competitive_analysis (11 Spalten) - Wettbewerb
├── swot_analysis (10 Spalten) - SWOT-Analysen
└── platform_recommendations (13 Spalten) - Plattform-Tipps
```

### Data Volume Estimates
- **Total Records:** ~500k Zeilen
- **Storage:** ~2GB (mit Indizes ~5GB)
- **Growth Rate:** 50k neue Zeilen/Monat
- **Peak Load:** 1000 concurrent users

### Critical Dependencies
- **Supabase Auth:** 5000+ aktive Sessions
- **Edge Functions:** 12 Functions (vc-*, admin-*, onboarding-*)
- **RLS Policies:** 50+ Row Level Security Rules
- **Real-time:** WebSocket-Subscriptions für Dashboards

## 3. Target AWS Architecture

### Core Database Layer
```
Amazon RDS PostgreSQL 15 (Multi-AZ)
├── Instance: db.r6g.xlarge (4 vCPU, 32GB RAM)
├── Storage: 500GB GP3 (3000 IOPS, 125MB/s)
├── Backup: 7-day automated, 35-day manual
├── Encryption: KMS Customer Managed Keys
├── Monitoring: Enhanced Monitoring + Performance Insights
└── Read Replicas: 2x für Analytics-Workloads
```

### Authentication & Authorization
```
Amazon Cognito User Pools
├── User Management: 10k+ Users
├── MFA: SMS + TOTP Support
├── Social Providers: Google, Facebook OAuth
├── Custom Attributes: Persona, Preferences
├── Lambda Triggers: Pre/Post Auth Hooks
└── JWT Integration: API Gateway Authorization
```

### API Layer
```
Amazon API Gateway (REST + WebSocket)
├── REST APIs: CRUD Operations
├── WebSocket: Real-time Dashboard Updates
├── Rate Limiting: 1000 req/min per user
├── Caching: 5-minute TTL für Read-Heavy Endpoints
├── Monitoring: CloudWatch + X-Ray Tracing
└── Security: WAF + API Keys + JWT
```

### Serverless Functions
```
AWS Lambda (Node.js 20)
├── vc-start: Visibility Check Initiierung
├── vc-bedrock-run: KI-Analyse mit Bedrock
├── vc-result: Ergebnis-Aufbereitung
├── admin-overview: Admin-Dashboard APIs
├── onboarding-*: Onboarding-Workflows
├── partner-credits: Commerce-Logik
└── auth-hooks: Cognito-Integration
```

### Data Lake & Analytics
```
Amazon S3 Data Lake
├── Raw Data: Tägliche RDS-Exports (Parquet)
├── Curated Data: ETL-verarbeitete Datasets
├── ML Features: Feature-Store für Personalisierung
├── Archival: Glacier für Compliance (3+ Jahre)
└── Security: SSE-KMS + Bucket Policies

Amazon Athena + Glue
├── Data Catalog: Automatische Schema-Discovery
├── ETL Jobs: Glue für Daten-Transformation
├── Query Engine: Athena für Ad-hoc Analytics
└── BI Integration: QuickSight Dashboards
```

### Caching & Performance
```
Amazon ElastiCache (Redis 7)
├── Session Store: Cognito-Sessions
├── API Cache: Häufige Queries (GMB-Daten, Kategorien)
├── Rate Limiting: Token-Bucket-Algorithmus
├── Real-time: WebSocket-Connection-State
└── ML Cache: Personalisierungs-Features
```

### Monitoring & Observability
```
CloudWatch + X-Ray + CloudTrail
├── Application Metrics: API-Latenz, Error-Rates
├── Infrastructure Metrics: RDS, Lambda, API Gateway
├── Distributed Tracing: Request-Flow-Analyse
├── Log Aggregation: Structured JSON-Logs
├── Alerting: PagerDuty-Integration
└── Dashboards: Grafana für Business-Metrics
```

## 4. Migration Strategy

### Phase 1: Foundation (Wochen 1-4)
**Ziel:** AWS-Infrastruktur aufbauen

#### Infrastructure as Code
```yaml
# Terraform/CDK Stack
Resources:
  - VPC mit Private/Public Subnets
  - RDS PostgreSQL Multi-AZ
  - Cognito User Pool + Identity Pool
  - API Gateway + Lambda Functions
  - S3 Buckets mit Lifecycle-Policies
  - ElastiCache Redis Cluster
  - CloudWatch Dashboards
```

#### Database Schema Migration
```sql
-- 1. Schema-Export von Supabase
pg_dump --schema-only supabase_db > schema.sql

-- 2. AWS RDS Schema-Import
psql -h rds-endpoint -d matbakh_prod -f schema.sql

-- 3. Indizes & Constraints optimieren
CREATE INDEX CONCURRENTLY idx_business_partners_user_id 
ON business_partners(user_id) WHERE status = 'active';

-- 4. Partitionierung für große Tabellen
CREATE TABLE visibility_check_leads_y2025m01 
PARTITION OF visibility_check_leads 
FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
```

#### Authentication Migration
```javascript
// Cognito User Pool Setup
const userPool = new cognito.UserPool(this, 'MatbakhUserPool', {
  userPoolName: 'matbakh-users',
  signInAliases: { email: true },
  autoVerify: { email: true },
  passwordPolicy: {
    minLength: 8,
    requireLowercase: true,
    requireUppercase: true,
    requireDigits: true,
  },
  mfa: cognito.Mfa.OPTIONAL,
  mfaSecondFactor: {
    sms: true,
    otp: true,
  },
});

// Lambda Triggers
userPool.addTrigger(cognito.UserPoolOperation.PRE_SIGN_UP, preSignUpLambda);
userPool.addTrigger(cognito.UserPoolOperation.POST_CONFIRMATION, postConfirmLambda);
```

### Phase 2: Data Migration (Wochen 5-8)
**Ziel:** Daten ohne Downtime migrieren

#### Migration Tools
```bash
# AWS Database Migration Service
aws dms create-replication-instance \
  --replication-instance-identifier matbakh-migration \
  --replication-instance-class dms.r5.xlarge \
  --allocated-storage 100

# Source Endpoint (Supabase)
aws dms create-endpoint \
  --endpoint-identifier supabase-source \
  --endpoint-type source \
  --engine-name postgres \
  --server-name db.supabase.co \
  --port 5432 \
  --database-name postgres \
  --username postgres

# Target Endpoint (RDS)
aws dms create-endpoint \
  --endpoint-identifier rds-target \
  --endpoint-type target \
  --engine-name postgres \
  --server-name matbakh-prod.cluster-xyz.eu-central-1.rds.amazonaws.com \
  --port 5432 \
  --database-name matbakh
```

#### Migration Phases
```
1. Full Load (Wochenende):
   - Alle historischen Daten (500k Zeilen)
   - Geschätzte Dauer: 4-6 Stunden
   - Validation: Row-Count + Checksum-Vergleich

2. CDC (Change Data Capture):
   - Kontinuierliche Synchronisation
   - Latenz: < 5 Sekunden
   - Monitoring: DMS CloudWatch Metrics

3. Cutover (Wartungsfenster):
   - DNS-Switch von Supabase zu AWS
   - Application-Restart mit neuen Configs
   - Rollback-Plan: DNS-Revert in 5 Minuten
```

#### Data Validation
```sql
-- Row Count Validation
SELECT 
  'supabase' as source, 
  table_name, 
  row_count 
FROM supabase_row_counts
UNION ALL
SELECT 
  'aws' as source, 
  table_name, 
  row_count 
FROM aws_row_counts
ORDER BY table_name, source;

-- Data Integrity Checks
SELECT 
  table_name,
  column_name,
  null_count,
  distinct_count,
  min_value,
  max_value
FROM data_quality_report
WHERE discrepancy_flag = true;
```

### Phase 3: Application Migration (Wochen 9-12)
**Ziel:** Frontend & APIs auf AWS umstellen

#### API Gateway Integration
```yaml
# OpenAPI Specification
paths:
  /api/v1/vc/start:
    post:
      x-amazon-apigateway-integration:
        type: aws_proxy
        httpMethod: POST
        uri: arn:aws:apigateway:eu-central-1:lambda:path/2015-03-31/functions/arn:aws:lambda:eu-central-1:ACCOUNT:function:vc-start/invocations
      security:
        - CognitoAuthorizer: []
      responses:
        200:
          description: Success
        400:
          description: Bad Request
        429:
          description: Rate Limited
```

#### Lambda Functions Migration
```javascript
// vc-start Lambda
exports.handler = async (event) => {
  const { email, business_name } = JSON.parse(event.body);
  
  // Validate Input
  if (!email || !business_name) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing required fields' })
    };
  }
  
  // Database Insert
  const client = new Client({
    host: process.env.RDS_ENDPOINT,
    database: 'matbakh',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });
  
  await client.connect();
  
  const result = await client.query(
    'INSERT INTO visibility_check_leads (email, business_name, status) VALUES ($1, $2, $3) RETURNING id',
    [email, business_name, 'pending']
  );
  
  await client.end();
  
  // Trigger Analysis
  await sns.publish({
    TopicArn: process.env.VC_ANALYSIS_TOPIC,
    Message: JSON.stringify({ lead_id: result.rows[0].id })
  }).promise();
  
  return {
    statusCode: 200,
    body: JSON.stringify({ success: true, lead_id: result.rows[0].id })
  };
};
```

#### Frontend Configuration
```typescript
// AWS Config
const awsConfig = {
  region: 'eu-central-1',
  userPoolId: 'eu-central-1_ABC123DEF',
  userPoolWebClientId: 'abc123def456ghi789',
  apiGatewayUrl: 'https://api.matbakh.app/v1',
  identityPoolId: 'eu-central-1:12345678-1234-1234-1234-123456789012'
};

// Cognito Auth Setup
import { Amplify } from 'aws-amplify';
Amplify.configure({
  Auth: {
    region: awsConfig.region,
    userPoolId: awsConfig.userPoolId,
    userPoolWebClientId: awsConfig.userPoolWebClientId,
    identityPoolId: awsConfig.identityPoolId,
  },
  API: {
    endpoints: [
      {
        name: 'matbakh-api',
        endpoint: awsConfig.apiGatewayUrl,
        region: awsConfig.region,
      }
    ]
  }
});
```

### Phase 4: Optimization (Wochen 13-16)
**Ziel:** Performance & Cost Optimization

#### Database Optimization
```sql
-- Query Performance Tuning
EXPLAIN (ANALYZE, BUFFERS) 
SELECT bp.*, vc.overall_score 
FROM business_partners bp
LEFT JOIN visibility_check_results vc ON bp.id = vc.business_profile_id
WHERE bp.status = 'active' 
  AND bp.created_at >= '2024-01-01'
ORDER BY vc.overall_score DESC NULLS LAST
LIMIT 50;

-- Index Optimization
CREATE INDEX CONCURRENTLY idx_business_partners_status_created 
ON business_partners(status, created_at DESC) 
WHERE status = 'active';

-- Partitioning Strategy
CREATE TABLE visibility_check_leads_y2025 (
  LIKE visibility_check_leads INCLUDING ALL
) PARTITION BY RANGE (created_at);

-- Materialized Views für Analytics
CREATE MATERIALIZED VIEW mv_partner_kpis AS
SELECT 
  DATE_TRUNC('month', created_at) as month,
  COUNT(*) as new_partners,
  COUNT(*) FILTER (WHERE status = 'active') as active_partners,
  AVG(vc_score) as avg_vc_score
FROM business_partners bp
LEFT JOIN visibility_check_results vc ON bp.id = vc.business_profile_id
GROUP BY DATE_TRUNC('month', created_at);

REFRESH MATERIALIZED VIEW CONCURRENTLY mv_partner_kpis;
```

#### Caching Strategy
```javascript
// Redis Caching Layer
const redis = new Redis({
  host: process.env.REDIS_ENDPOINT,
  port: 6379,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
});

// Cache-Aside Pattern
async function getBusinessProfile(partnerId) {
  const cacheKey = `business_profile:${partnerId}`;
  
  // Try Cache First
  let profile = await redis.get(cacheKey);
  if (profile) {
    return JSON.parse(profile);
  }
  
  // Fallback to Database
  profile = await db.query(
    'SELECT * FROM business_partners WHERE id = $1',
    [partnerId]
  );
  
  // Cache for 5 minutes
  await redis.setex(cacheKey, 300, JSON.stringify(profile));
  
  return profile;
}

// Cache Invalidation
async function updateBusinessProfile(partnerId, updates) {
  await db.query(
    'UPDATE business_partners SET ... WHERE id = $1',
    [partnerId]
  );
  
  // Invalidate Cache
  await redis.del(`business_profile:${partnerId}`);
}
```

## 5. Risk Mitigation

### Technical Risks
```
1. Data Loss Risk: MEDIUM
   Mitigation: 
   - DMS mit CDC für kontinuierliche Sync
   - Point-in-Time Recovery für RDS
   - Automated Backups alle 6 Stunden

2. Downtime Risk: LOW
   Mitigation:
   - Blue-Green Deployment
   - DNS-basierter Traffic-Switch
   - 5-Minuten Rollback-Plan

3. Performance Risk: MEDIUM
   Mitigation:
   - Load Testing mit 10x Traffic
   - Auto-Scaling für Lambda/RDS
   - CloudFront CDN für statische Assets

4. Security Risk: LOW
   Mitigation:
   - WAF + Shield für DDoS-Schutz
   - VPC mit Private Subnets
   - Encryption at Rest + in Transit
```

### Business Risks
```
1. User Experience Impact: MEDIUM
   Mitigation:
   - Feature-Flag-basierte Rollouts
   - A/B Testing für kritische Flows
   - 24/7 Monitoring während Migration

2. Revenue Impact: LOW
   Mitigation:
   - Migration außerhalb Peak-Zeiten
   - Rollback-Plan in < 5 Minuten
   - Customer Communication Plan

3. Compliance Risk: LOW
   Mitigation:
   - DSGVO-Audit vor Go-Live
   - Data Processing Agreements
   - Audit-Trail für alle Änderungen
```

## 6. Success Metrics

### Performance KPIs
```
API Response Times:
- P50: < 100ms (vs. 150ms Supabase)
- P95: < 500ms (vs. 800ms Supabase)
- P99: < 1000ms (vs. 2000ms Supabase)

Database Performance:
- Query Latency: < 50ms (vs. 100ms)
- Connection Pool: 95% utilization
- Read Replica Lag: < 1 second

Availability:
- Uptime: 99.9% (vs. 99.5% Supabase)
- RTO: < 5 minutes
- RPO: < 1 minute
```

### Cost Optimization
```
Monthly Costs (10k Users):
- Supabase: €2000/month
- AWS Target: €800/month (-60%)

Cost Breakdown:
- RDS: €300/month
- Lambda: €150/month
- API Gateway: €100/month
- ElastiCache: €80/month
- S3 + Athena: €50/month
- CloudWatch: €30/month
- Data Transfer: €90/month
```

### Business Impact
```
User Experience:
- Page Load Time: -40%
- API Error Rate: < 0.1%
- User Satisfaction: > 4.5/5

Development Velocity:
- Deployment Frequency: 2x/day
- Lead Time: < 2 hours
- MTTR: < 15 minutes

Scalability:
- Concurrent Users: 10k (vs. 1k)
- Data Volume: 100GB (vs. 5GB)
- Request Rate: 10k/min (vs. 1k/min)
```

## 7. Implementation Timeline

### Detailed Roadmap
```
Woche 1-2: Infrastructure Setup
├── AWS Account Setup + IAM
├── VPC + Networking
├── RDS PostgreSQL Cluster
├── Cognito User Pool
└── Basic Lambda Functions

Woche 3-4: Database Migration Prep
├── Schema Analysis + Optimization
├── DMS Setup + Testing
├── Data Validation Scripts
└── Migration Runbooks

Woche 5-6: Data Migration
├── Full Load Migration
├── CDC Setup + Monitoring
├── Data Validation
└── Performance Testing

Woche 7-8: Application Migration
├── Lambda Functions Deployment
├── API Gateway Configuration
├── Frontend Config Updates
└── Integration Testing

Woche 9-10: Cutover Preparation
├── Load Testing
├── Security Audit
├── Rollback Testing
└── Team Training

Woche 11-12: Production Cutover
├── DNS Switch
├── Traffic Monitoring
├── Performance Validation
└── Issue Resolution

Woche 13-14: Optimization
├── Query Performance Tuning
├── Cache Optimization
├── Cost Analysis
└── Documentation

Woche 15-16: Stabilization
├── Monitoring Setup
├── Alerting Configuration
├── Team Handover
└── Post-Migration Review
```

### Resource Requirements
```
Team:
- 1x DevOps Engineer (Full-time)
- 1x Backend Developer (Full-time)
- 1x Frontend Developer (Part-time)
- 1x QA Engineer (Part-time)
- 1x Security Specialist (Consultant)

Budget:
- AWS Infrastructure: €1200/month
- Migration Tools: €500 one-time
- External Consulting: €5000
- Team Time: €25000 (4 months)
```

## 8. Post-Migration Roadmap

### Phase 5: Advanced Features (Monate 5-6)
```
Data Lake Analytics:
- Real-time Streaming mit Kinesis
- ML-Pipeline für Personalisierung
- Advanced BI mit QuickSight

Multi-Region Setup:
- EU-West-1 als Secondary Region
- Cross-Region Replication
- Disaster Recovery Testing

API Optimization:
- GraphQL mit AppSync
- Real-time Subscriptions
- Advanced Caching Strategies
```

### Phase 6: Enterprise Features (Monate 7-12)
```
Compliance & Security:
- SOC2 Type II Certification
- HIPAA Compliance (für US-Expansion)
- Advanced Threat Detection

Scalability:
- Auto-Scaling Policies
- Database Sharding
- CDN Optimization

Monitoring & Observability:
- Custom Metrics Dashboard
- Predictive Alerting
- Cost Optimization Automation
```

---

**NEXT STEPS:**
1. Stakeholder Review & Approval
2. AWS Account Setup & Budgeting
3. Team Assembly & Training
4. Detailed Technical Design
5. Migration Kickoff Meeting

**DECISION REQUIRED:**
- Budget Approval: €32k total
- Timeline Approval: 16 Wochen
- Team Resource Allocation
- Go/No-Go Decision by: [DATE]