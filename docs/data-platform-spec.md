# Data Platform Specification - matbakh.app

## 1. Dateninventar & Zweckbindung (P0)

### Datenquellen mit Zweck & Rechtsgrundlage

#### Supabase Postgres (App-Profile, Onboarding, Produktnutzung)
- **Zweck**: Anwendungslogik, Nutzerprofile, Onboarding-Tracking
- **Rechtsgrundlage**: Vertrag (Art. 6 Abs. 1 lit. b DSGVO)
- **Tabellen**:
  - `user_profiles`: PII (email, name), Non-PII (preferences, settings)
  - `onboarding_progress`: Non-PII (steps, completion_status)
  - `communication_prefs`: Non-PII (tone, address, help_level)
- **Retention**: Aktive Nutzer unbegrenzt, inaktive nach 36 Monaten
- **Owner**: Product Team

#### DynamoDB (VcTokens, ConsentJournal P1)
- **Zweck**: Token-Management, Consent-Dokumentation
- **Rechtsgrundlage**: DOI (Art. 6 Abs. 1 lit. a DSGVO)
- **Tabellen**:
  - `VcTokens`: PII (email_lower, ip_start), Non-PII (token_hash, status)
  - `ConsentJournal` (P1): PII (email), Non-PII (consent_type, decision)
- **Retention**: VcTokens TTL 7 Tage, ConsentJournal 3 Jahre
- **Owner**: Legal/Compliance Team

#### SES/SNS (Bounces, Complaints)
- **Zweck**: E-Mail-Zustellbarkeit, Reputation-Management
- **Rechtsgrundlage**: Berechtigtes Interesse (Art. 6 Abs. 1 lit. f DSGVO)
- **Daten**: PII (email), Non-PII (bounce_type, complaint_reason)
- **Retention**: 18 Monate
- **Owner**: DevOps Team

#### GA4 Data API (Property 495696125)
- **Zweck**: Nutzungsanalyse, Produktoptimierung
- **Rechtsgrundlage**: Consent (Art. 6 Abs. 1 lit. a DSGVO)
- **Daten**: Non-PII (client_id, events, sessions), pseudonymisiert
- **Retention**: 14 Monate (GA4 Standard)
- **Owner**: Analytics Team

#### Google Business Profile (business.manage)
- **Zweck**: Visibility Check, Profil-Optimierung
- **Rechtsgrundlage**: Vertrag (Art. 6 Abs. 1 lit. b DSGVO)
- **Daten**: Non-PII (place_id, ratings, photos, hours)
- **Retention**: 24 Monate
- **Owner**: Product Team

#### Facebook/Instagram (Login + Pages/IG)
- **Zweck**: OAuth-Login, Social Media Integration
- **Rechtsgrundlage**: Consent (Art. 6 Abs. 1 lit. a DSGVO)
- **Daten**: PII (email, name), Non-PII (page_id, ig_business_id)
- **Retention**: 24 Monate
- **Owner**: Product Team

## 2. Kanonische IDs & Identity Resolution

### Stabile Schlüssel-Definitionen
```
user_id: UUIDv7 (primärer Schlüssel, zeitbasiert sortierbar)
account_id: UUIDv7 (Business-Account, 1:N zu user_id)
location_id: UUIDv7 (Restaurant-Standort, 1:N zu account_id)
email_lower: VARCHAR (primärer Join bei Consent-Operationen)
```

### External IDs
```
gbp_place_id: Google Business Profile Place ID
ga4_client_id: Google Analytics Client ID
ga4_user_id: Google Analytics User ID
fb_page_id: Facebook Page ID
ig_business_id: Instagram Business Account ID
```

### Identity Links Tabelle
```sql
CREATE TABLE identity_links (
  user_id UUID NOT NULL,
  external_id VARCHAR(255) NOT NULL,
  source VARCHAR(50) NOT NULL, -- 'gbp', 'ga4', 'facebook', 'instagram'
  first_seen TIMESTAMP NOT NULL,
  last_seen TIMESTAMP NOT NULL,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB,
  PRIMARY KEY (user_id, external_id, source)
);
```

### Event-Payload Standard
```json
{
  "user_id": "01HN123...",
  "account_id": "01HN456...",
  "location_id": "01HN789...",
  "external_ids": {
    "gbp_place_id": "ChIJ...",
    "ga4_client_id": "123.456",
    "fb_page_id": "789012345"
  },
  "timestamp": "2025-01-27T16:00:00Z",
  "event_type": "step_completed",
  "properties": {...}
}
```

## 3. Speicher-/Verarbeitungsschichten (AWS-zentriert)

### OLTP Layer
- **Supabase Postgres**: Transaktionale Daten, Echtzeit-Queries
- **DynamoDB**: Token-Management, Consent-Journal, Session-State

### Data Lake (S3)
```
s3://matbakh-data-{env}/
├── raw/                    # Rohdaten, unverarbeitet
│   ├── supabase/          # Tägliche Postgres-Exports
│   ├── dynamodb/          # DynamoDB Streams
│   ├── ga4/               # GA4 API Pulls
│   └── ses/               # E-Mail-Events
├── curated/               # Bereinigte, strukturierte Daten
│   ├── facts/             # Faktentabellen (Parquet)
│   └── dimensions/        # Dimensionstabellen (Parquet)
└── ml/                    # ML-Features, Segmente
    ├── features/          # Feature-Store
    └── segments/          # Nutzer-Segmente
```

### Sicherheit & Governance
- **Verschlüsselung**: SSE-KMS mit Customer Managed Keys
- **Zugriff**: IAM Least-Privilege, Bucket Policies
- **Monitoring**: CloudTrail, Access Logs
- **Block Public Access**: Aktiviert auf allen Buckets

### Katalog & Abfrage
- **AWS Glue Data Catalog**: Metadaten-Management
- **Amazon Athena**: Ad-hoc SQL-Queries
- **Redshift Serverless** (P1): BI-Marts für komplexe Analytics

### Ingestion Pipeline (P0)

#### Batch Ingestion
```
Supabase → Airbyte/Custom Job → S3 (täglich, 02:00 UTC)
GA4 Data API → Lambda → S3 Parquet (täglich, 03:00 UTC)
SES SNS → SQS → Lambda → S3 curated (near real-time)
```

#### Stream Ingestion
```
DynamoDB Streams → Kinesis Data Firehose → S3 raw (real-time)
```

#### Ingestion P1 (Near Real-time)
```
Supabase → Debezium CDC → Kafka → Kinesis → S3
```

## 4. Datenmodelle (Star Schema)

### Faktentabellen (Facts)

#### fact_onboarding_steps
```sql
CREATE TABLE fact_onboarding_steps (
  event_id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  account_id UUID,
  step_id VARCHAR(50) NOT NULL,
  event_type VARCHAR(20) NOT NULL, -- 'started', 'completed', 'skipped'
  persona VARCHAR(20),
  comm_prefs JSONB,
  duration_seconds INTEGER,
  timestamp TIMESTAMP NOT NULL,
  date_key INTEGER NOT NULL -- YYYYMMDD
);
```

#### fact_visibility_check
```sql
CREATE TABLE fact_visibility_check (
  check_id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  account_id UUID NOT NULL,
  location_id UUID,
  overall_score INTEGER,
  gbp_score INTEGER,
  social_score INTEGER,
  web_score INTEGER,
  competitor_count INTEGER,
  processing_time_seconds INTEGER,
  timestamp TIMESTAMP NOT NULL,
  date_key INTEGER NOT NULL
);
```

#### fact_email_events
```sql
CREATE TABLE fact_email_events (
  event_id UUID PRIMARY KEY,
  user_id UUID,
  email_lower VARCHAR(255) NOT NULL,
  campaign_id VARCHAR(100),
  event_type VARCHAR(20) NOT NULL, -- 'delivered', 'open', 'click', 'bounce', 'complaint'
  copy_variant VARCHAR(50),
  subject_variant VARCHAR(50),
  timestamp TIMESTAMP NOT NULL,
  date_key INTEGER NOT NULL
);
```

#### fact_login_oauth
```sql
CREATE TABLE fact_login_oauth (
  event_id UUID PRIMARY KEY,
  user_id UUID,
  provider VARCHAR(20) NOT NULL, -- 'google', 'facebook'
  success BOOLEAN NOT NULL,
  error_code VARCHAR(50),
  timestamp TIMESTAMP NOT NULL,
  date_key INTEGER NOT NULL
);
```

### Dimensionstabellen (Dimensions)

#### dim_user
```sql
CREATE TABLE dim_user (
  user_id UUID PRIMARY KEY,
  email_hash VARCHAR(64), -- SHA-256 für Analytics
  signup_date DATE,
  persona VARCHAR(20),
  communication_prefs JSONB,
  is_active BOOLEAN,
  last_login TIMESTAMP
);
```

#### dim_account
```sql
CREATE TABLE dim_account (
  account_id UUID PRIMARY KEY,
  business_name VARCHAR(255),
  main_category VARCHAR(100),
  price_range VARCHAR(20),
  created_date DATE,
  is_active BOOLEAN
);
```

#### dim_location
```sql
CREATE TABLE dim_location (
  location_id UUID PRIMARY KEY,
  account_id UUID NOT NULL,
  address TEXT,
  city VARCHAR(100),
  country VARCHAR(50),
  gbp_place_id VARCHAR(255),
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8)
);
```

### ERD (ASCII)
```
dim_user (user_id) ──┐
                     │
                     ├── fact_onboarding_steps
                     ├── fact_visibility_check
                     ├── fact_email_events
                     └── fact_login_oauth
                     
dim_account (account_id) ──┐
                           ├── fact_onboarding_steps
                           └── fact_visibility_check
                           
dim_location (location_id) ── fact_visibility_check

dim_time (date_key) ──┐
                      ├── fact_onboarding_steps
                      ├── fact_visibility_check
                      ├── fact_email_events
                      └── fact_login_oauth
```

### Join-Wege
- **User Journey**: dim_user → fact_onboarding_steps → dim_time
- **Business Performance**: dim_account → fact_visibility_check → dim_location
- **Email Engagement**: dim_user → fact_email_events → dim_time
- **Authentication**: dim_user → fact_login_oauth → dim_time

## 5. Segmentierung & Ableitungen

### Tägliche Segment-Jobs (AWS Glue/Lambda)

#### Onboarding Segmente
```sql
-- onb_day: Tage seit Registrierung
SELECT user_id, 
       DATEDIFF(CURRENT_DATE, signup_date) as onb_day
FROM dim_user;

-- engagement_level: Basierend auf Aktivität
SELECT user_id,
       CASE 
         WHEN step_count >= 10 THEN 'high'
         WHEN step_count >= 5 THEN 'medium'
         ELSE 'low'
       END as engagement_level
FROM user_step_counts;
```

#### Consent & Persona Segmente
```sql
-- consent_state: Aktueller Consent-Status
SELECT user_id,
       CASE 
         WHEN marketing_consent = true THEN 'marketing_opted_in'
         WHEN email_verified = true THEN 'email_only'
         ELSE 'unverified'
       END as consent_state
FROM user_consent_status;

-- persona_current: Aktuelle Persona-Zuordnung
SELECT user_id, persona as persona_current
FROM dim_user 
WHERE is_active = true;
```

### Feature-Tabelle (ML/Features)
```sql
CREATE TABLE ml_user_features (
  user_id UUID PRIMARY KEY,
  feature_date DATE NOT NULL,
  
  -- 7-Tage Features
  steps_completed_7d INTEGER,
  email_opens_7d INTEGER,
  email_clicks_7d INTEGER,
  vc_score_delta_7d INTEGER,
  
  -- 30-Tage Features
  steps_completed_30d INTEGER,
  email_opens_30d INTEGER,
  email_clicks_30d INTEGER,
  login_count_30d INTEGER,
  
  -- Aggregierte Features
  avg_step_duration_seconds DECIMAL(10,2),
  preferred_comm_tone VARCHAR(20),
  last_activity_days_ago INTEGER,
  
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 6. Lernschleifen (ohne Modelltraining P0)

### A/B/Multi-Armed Bandit für Copy-Varianten

#### Kontext-Dimensionen
- **persona**: solo-sarah, bewahrer-ben, wachstums-walter, ketten-katrin
- **comm_prefs**: encouraging/facts/brief × sie/du/neutral
- **onb_day**: 0, 1-3, 4-7, 8-14, 15+

#### Thompson Sampling Policy
```python
# Pseudo-Code für Bandit-Logik
def select_copy_variant(user_context):
    variants = get_variants_for_context(user_context)
    
    if total_events < 30:
        return random.choice(variants)  # Exploration
    
    # Thompson Sampling
    best_variant = None
    best_sample = 0
    
    for variant in variants:
        alpha = variant.successes + 1
        beta = variant.failures + 1
        sample = beta_distribution.sample(alpha, beta)
        
        if sample > best_sample:
            best_sample = sample
            best_variant = variant
    
    return best_variant
```

#### Feedback-Signale
- **Positive**: step_completed (< 2 min), onb_complete, email_click, VC_score_delta > 0
- **Negative**: step_abandoned (> 5 min), email_bounce, unsubscribe

#### Guardrails
- Keine Nutzung sensibler Merkmale (Geschlecht, Herkunft, Alter)
- Nur explizite Präferenzen und Verhaltensdaten
- Fairness-Monitoring: Performance-Unterschiede zwischen Gruppen < 5%

## 7. Governance, DSGVO & Aufbewahrung

### Consent-Gating
```sql
-- Beispiel: Verarbeitung nur bei gültigem Zweck
SELECT * FROM user_data u
JOIN consent_status c ON u.user_id = c.user_id
WHERE c.purpose = 'vc_report' 
  AND c.status = 'granted'
  AND c.expires_at > CURRENT_TIMESTAMP;
```

### Retention-Richtlinien

| Datensatz | Zweck | Aufbewahrung | Rechtsgrundlage | Löschpfad |
|-----------|-------|--------------|-----------------|-----------|
| VcTokens (unbestätigt) | DOI-Prozess | 7 Tage TTL | Consent | Automatisch |
| ConsentJournal | Compliance | 3 Jahre | Legal Obligation | Batch-Job |
| E-Mail-Events | Reputation | 18 Monate | Legitimate Interest | S3 Lifecycle |
| GA4 Rohdaten | Analytics | 14 Monate | Consent | GA4 Auto-Delete |
| Supabase Rohdaten | App-Funktion | 36 Monate inaktiv | Contract | Cascade Delete |
| S3 Raw | Backup | 90 Tage | Legitimate Interest | S3 Lifecycle |
| S3 Curated/ML | Analytics | 24 Monate | Consent | Partition Drop |

### Rechte Betroffener

#### Export-Prozess
```sql
-- Vollständiger Datenexport per user_id
SELECT 'user_profiles' as table_name, * FROM user_profiles WHERE user_id = ?
UNION ALL
SELECT 'onboarding_progress', * FROM onboarding_progress WHERE user_id = ?
UNION ALL
SELECT 'email_events', * FROM email_events WHERE user_id = ?;
```

#### Löschpfad (Kaskadierend)
1. **Supabase**: `DELETE FROM user_profiles WHERE user_id = ?`
2. **DynamoDB**: Scan & Delete by email_lower
3. **S3**: Delete partitioned data by user_id hash
4. **GA4**: User-Deletion API (wenn verfügbar)

### Sicherheit
- **Verschlüsselung**: SSE-KMS (S3), Encryption at Rest (RDS/DynamoDB)
- **Transport**: TLS 1.3 für alle Verbindungen
- **Zugriff**: IAM Least-Privilege, MFA für Admin-Zugriff
- **Monitoring**: CloudTrail, GuardDuty, Config Rules
- **Pseudonymisierung**: SHA-256(email) für Analytics-Zwecke
- **Data Minimization**: Nur erforderliche Felder sammeln

## 8. Data Quality & Freshness

### DQ-Checks (AWS Glue Data Quality)
```python
# Beispiel DQ-Rules
dq_rules = [
    "ColumnCount = 10",  # Schema-Drift Detection
    "IsComplete 'user_id'",  # Null-Rate Check
    "IsUnique 'user_id'",  # Duplikate Check
    "ColumnValues 'persona' in ['solo-sarah', 'bewahrer-ben', 'wachstums-walter', 'ketten-katrin']"
]
```

### Freshness-SLAs
- **GA4 Export**: ≤ 24h (täglich 03:00 UTC)
- **Supabase Export**: ≤ 24h (täglich 02:00 UTC)
- **DynamoDB Streams**: ≤ 5 Min (near real-time)
- **SES Events**: ≤ 1 Min (real-time)

### Monitoring & Alerting
```yaml
# CloudWatch Alarms
DataFreshness:
  - GA4ExportDelay > 26h
  - SupabaseExportDelay > 26h
  
DataQuality:
  - GlueJobFailure
  - DQRuleViolation > 5%
  
Costs:
  - S3StorageCost > $500/month
  - AthenaCost > $200/month
```

## 9. Schnittstellen zu KI

### RAG (P1)
```
S3 Curated Data → AWS Bedrock Knowledge Bases → OpenSearch
- Nur nicht-PII Dokumentation und Insights
- Anonymisierte Nutzungsmuster für Empfehlungen
```

### Personalization Runtime
```python
# Lambda-basierte Personalisierung
def get_personalized_content(user_id, context):
    features = get_user_features(user_id)
    segments = get_user_segments(user_id)
    
    # Rules-based + Bandit
    if segments['engagement_level'] == 'low':
        return get_encouraging_copy()
    elif features['preferred_comm_tone'] == 'facts':
        return get_factual_copy()
    else:
        return bandit_select_copy(context)
```

### P1 ML-Modelle
- **SageMaker**: Logistische Regression für Churn-Prediction
- **Bedrock Agents**: Workflow-basierte Empfehlungen
- **Consent-Gating**: Alle ML-Features nur mit explizitem Consent

## 10. Implementation Roadmap

### Phase 1 (P0) - Wochen 1-4
1. S3 Data Lake Setup mit Sicherheit
2. Supabase → S3 Export Pipeline
3. DynamoDB Streams → S3 Ingestion
4. Basis-Faktentabellen (Onboarding, VC, Email)
5. Consent-Gating Implementation

### Phase 2 (P1) - Wochen 5-8
1. GA4 Data API Integration
2. Glue Data Catalog & Athena Setup
3. ML Feature Store
4. Bandit-basierte Copy-Optimierung
5. ConsentJournal Implementation

### Phase 3 (P2) - Wochen 9-12
1. Near Real-time CDC
2. Redshift Serverless BI-Marts
3. Advanced ML-Modelle
4. RAG Knowledge Base
5. Advanced Segmentierung

### Success Metrics
- **Data Freshness**: 95% SLA-Compliance
- **Data Quality**: < 1% DQ-Rule-Violations
- **Cost Efficiency**: < $1000/month für 10k Users
- **DSGVO Compliance**: 100% Audit-Success
- **Performance**: < 200ms für Personalization API