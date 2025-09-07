# Visibility Check Data Management System - Complete Documentation

## 🎯 Overview

The Visibility Check Data Management System is a comprehensive, GDPR-compliant end-to-end solution for collecting, processing, and managing restaurant visibility analysis data. It transforms the simple email-based VC system into a sophisticated business intelligence platform with enterprise-grade security and compliance features.

## 🏗️ System Architecture

### Core Components

1. **Email Collection & Double Opt-In System**
   - GDPR-compliant email capture
   - Secure token-based confirmation
   - Automated consent tracking

2. **Business Data Collection Framework**
   - Progressive data gathering
   - Data quality scoring
   - Missing field identification

3. **AI Analysis Integration**
   - Bedrock/Claude integration
   - Comprehensive audit logging
   - Performance monitoring

4. **Results Management System**
   - Structured analysis storage
   - Multi-format export capabilities
   - Version control and history

5. **Admin Dashboard & Analytics**
   - Real-time statistics
   - Lead management interface
   - Export and reporting tools

6. **GDPR Compliance Engine**
   - Automated data retention
   - Right to be forgotten
   - Data portability features

## 📊 Database Schema

### Core Tables

#### `visibility_check_leads`
Primary table for lead management and tracking.

```sql
- id (uuid, primary key)
- email (text, unique when not deleted)
- confirm_token_hash (text, unique)
- confirm_expires_at (timestamptz)
- confirmed (boolean)
- analysis_status (enum: pending_opt_in, confirmed, data_collection, ai_analysis, completed, failed)
- language (text: de, en)
- retention_policy (text: standard, long)
- created_at, updated_at, deleted_at (timestamptz)
- UTM tracking fields
- IP and user agent for audit
```

#### `visibility_check_context_data`
Business information and context data.

```sql
- id (uuid, primary key)
- lead_id (uuid, foreign key)
- business_name, business_description (text)
- location fields (street, city, state, postal_code, country, lat/lng)
- category information (main_category, sub_categories[])
- online presence URLs (website, social media, GMB, etc.)
- benchmark_urls[] (competitor analysis)
- persona_type, user_goal, priority_areas[]
- data_completeness_score, missing_fields[]
```

#### `ai_action_logs`
Comprehensive audit trail for all AI operations.

```sql
- id (uuid, primary key)
- lead_id (uuid, foreign key)
- request_type (enum: visibility_check, persona_detection, etc.)
- provider (text: claude-3.5-sonnet, gemini-pro, etc.)
- prompt_template_id, prompt_hash
- raw_response, structured_response (jsonb)
- performance metrics (token_usage, response_time, cost)
- quality metrics (confidence_score, quality_score)
- error handling fields
- GDPR compliance (contains_pii, pii_redacted, redaction_log)
- audit fields (user_id, session_id, ip_address)
```

#### `visibility_check_results`
Analysis results and recommendations.

```sql
- id (uuid, primary key)
- lead_id (uuid, foreign key)
- summary_score, platform_scores (jsonb)
- SWOT analysis (strengths[], weaknesses[], opportunities[], threats[])
- strategic frameworks (porters_five_forces, balanced_scorecard, etc.)
- content analysis (suggestions[], gaps[], seasonal_opportunities[])
- actionable recommendations (quick_wins[], strategic_initiatives[])
- quality assurance (analysis_confidence, data_quality_score)
- versioning (version, previous_version_id)
```

#### `user_consent_tracking`
GDPR consent management and tracking.

```sql
- id (uuid, primary key)
- lead_id (uuid, foreign key)
- consent_type (enum: email_collection, data_analysis, etc.)
- consent_given (boolean)
- consent_method (enum: double_opt_in, checkbox, etc.)
- legal_basis (enum: consent, legitimate_interest, etc.)
- consent context (consent_text, privacy_policy_version)
- withdrawal tracking (withdrawn, withdrawn_at, withdrawal_method)
```

#### `visibility_check_followups`
Admin follow-up and conversion tracking.

```sql
- id (uuid, primary key)
- lead_id (uuid, foreign key)
- status (enum: new, contacted, interested, qualified, converted, etc.)
- contact information (method, attempts, dates)
- lead qualification (score, notes, business_size, budget_range)
- conversion tracking (converted_to_customer, conversion_date, value)
- admin management (notes, tags, assigned_to)
```

## 🔧 API Endpoints

### Public Endpoints

#### `POST /vc-data-management/collect-email`
Initiates the visibility check process with email collection.

**Request:**
```json
{
  "email": "user@example.com",
  "language": "de",
  "utm_source": "google",
  "utm_medium": "cpc",
  "utm_campaign": "visibility-check",
  "referrer_url": "https://example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Bestätigungs-E-Mail wurde gesendet.",
  "lead_id": "uuid"
}
```

#### `POST /vc-data-management/confirm-email`
Confirms email address via token validation.

**Request:**
```json
{
  "token": "confirmation-token"
}
```

#### `POST /vc-data-management/submit-business-data`
Submits business information for analysis.

**Request:**
```json
{
  "token": "confirmation-token",
  "business_name": "Restaurant Name",
  "business_description": "Description...",
  "location": {
    "city": "Berlin",
    "postal_code": "10115",
    "country": "DE"
  },
  "categories": {
    "main_category": "restaurant",
    "sub_categories": ["italian", "pizza"]
  },
  "online_presence": {
    "website_url": "https://example.com",
    "instagram_url": "https://instagram.com/restaurant",
    "gmb_url": "https://goo.gl/maps/..."
  },
  "benchmark_urls": ["competitor1.com", "competitor2.com"],
  "user_goal": "Increase online visibility",
  "priority_areas": ["social_media", "local_seo"]
}
```

#### `POST /vc-data-management/trigger-analysis`
Triggers AI analysis of submitted data.

#### `GET /vc-data-management/get-results`
Retrieves analysis results by token.

### Admin Endpoints

#### `GET /vc-data-management/admin-dashboard`
Returns dashboard data with statistics and lead information.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Results per page (default: 50)
- `status`: Filter by analysis status
- `date_from`: Filter by creation date
- `date_to`: Filter by creation date

#### `POST /export-vc-data`
Exports lead data in CSV or PDF format.

**Request:**
```json
{
  "format": "csv",
  "filters": {
    "status": "completed",
    "date_from": "2024-01-01",
    "date_to": "2024-12-31"
  },
  "include_analysis": true,
  "include_followup": true
}
```

#### `POST /vc-gdpr-cleanup/anonymize-lead`
Anonymizes lead data for GDPR compliance.

**Request:**
```json
{
  "email": "user@example.com"
}
```

#### `POST /vc-gdpr-cleanup/export-user-data`
Exports all user data for GDPR data portability.

## 🔒 Security & GDPR Compliance

### Data Protection Features

1. **Row Level Security (RLS)**
   - All tables protected with RLS policies
   - Super admin access controls
   - User-specific data isolation

2. **Data Encryption**
   - Encryption at rest (Supabase default)
   - Secure token generation and hashing
   - PII detection and redaction

3. **Audit Logging**
   - Comprehensive action logging
   - IP address and user agent tracking
   - Change history and versioning

### GDPR Compliance

1. **Lawful Basis**
   - Explicit consent collection
   - Consent tracking and management
   - Legal basis documentation

2. **Data Subject Rights**
   - Right to access (data export)
   - Right to rectification (data updates)
   - Right to erasure (anonymization)
   - Right to data portability (JSON export)

3. **Data Retention**
   - Automatic cleanup after 180 days
   - Configurable retention policies
   - Secure deletion procedures

4. **Privacy by Design**
   - Minimal data collection
   - Purpose limitation
   - Data minimization principles

## 📈 Analytics & Reporting

### Dashboard Statistics

The system provides comprehensive analytics through the `get_vc_dashboard_stats()` function:

- **Lead Metrics**: Total leads, confirmation rates, completion rates
- **Conversion Analytics**: Lead to customer conversion tracking
- **Quality Metrics**: Average analysis scores, data completeness
- **Trend Analysis**: Leads over time, seasonal patterns
- **Category Insights**: Top business categories, performance by sector

### Export Capabilities

1. **CSV Export**
   - Complete lead data with business information
   - Analysis results and scores
   - Follow-up status and conversion data
   - Customizable field selection

2. **PDF Reports**
   - Executive summary format
   - Visual charts and graphs
   - Professional presentation layout
   - Branded report templates

### Performance Monitoring

- **Response Time Tracking**: API endpoint performance
- **AI Operation Metrics**: Token usage, cost tracking, confidence scores
- **System Health**: Error rates, success rates, uptime monitoring
- **Data Quality**: Completeness scores, missing field analysis

## 🚀 Deployment & Operations

### Deployment Process

1. **Database Migration**
   ```bash
   supabase db push
   ```

2. **Edge Functions**
   ```bash
   supabase functions deploy vc-data-management
   supabase functions deploy export-vc-data
   supabase functions deploy vc-gdpr-cleanup
   ```

3. **Environment Configuration**
   ```bash
   supabase secrets set FRONTEND_URL="https://matbakh.app"
   supabase secrets set RESEND_API_KEY="your-api-key"
   ```

### Automated Maintenance

1. **Daily Cleanup**
   - Expired token cleanup
   - Unconfirmed lead removal (30+ days)
   - Log rotation and archival

2. **Weekly Reports**
   - System health summary
   - Performance metrics
   - GDPR compliance status

3. **Monthly Tasks**
   - Data retention enforcement
   - Security audit review
   - Performance optimization

### Monitoring & Alerts

- **System Health**: Uptime monitoring, error rate alerts
- **Performance**: Response time thresholds, resource usage
- **Security**: Failed authentication attempts, suspicious activity
- **Compliance**: GDPR request handling, data retention compliance

## 🔧 Integration Points

### Frontend Integration

The system integrates with the existing frontend through:

1. **VCDataManagementFlow Component**: Complete user journey
2. **Admin Dashboard**: Lead management interface
3. **Export Functions**: Data download capabilities
4. **GDPR Tools**: User data management

### AI Integration

- **Bedrock Integration**: Claude 3.5 Sonnet for analysis
- **Prompt Management**: Template system with versioning
- **Cost Control**: Token usage tracking and limits
- **Quality Assurance**: Confidence scoring and validation

### Email Integration

- **Resend API**: Transactional email delivery
- **Template System**: Multilingual email templates
- **Delivery Tracking**: Open rates, click tracking
- **Bounce Handling**: Failed delivery management

## 📋 Testing & Quality Assurance

### Test Coverage

1. **Unit Tests**: Database functions, utility functions
2. **Integration Tests**: API endpoints, data flow
3. **Security Tests**: RLS policies, access controls
4. **Performance Tests**: Load testing, stress testing
5. **GDPR Tests**: Compliance verification, data handling

### Quality Metrics

- **Code Coverage**: >90% for critical functions
- **Performance**: <3s response time for analysis
- **Reliability**: 99.9% uptime target
- **Security**: Zero critical vulnerabilities

## 🎯 Future Enhancements

### Planned Features

1. **Multi-Language Support**: Extended language options
2. **Advanced Analytics**: Predictive modeling, trend analysis
3. **API Integrations**: Google My Business, social media APIs
4. **Mobile App**: Native mobile application
5. **White-Label Solution**: Partner customization options

### Scalability Improvements

1. **Caching Layer**: Redis for improved performance
2. **CDN Integration**: Global content delivery
3. **Database Optimization**: Partitioning, indexing
4. **Microservices**: Service decomposition
5. **Auto-Scaling**: Dynamic resource allocation

---

## 📞 Support & Maintenance

For technical support, system maintenance, or feature requests, please refer to the internal documentation or contact the development team.

**System Status**: ✅ Production Ready
**Last Updated**: September, 4, 2025
**Version**: 1.0.0