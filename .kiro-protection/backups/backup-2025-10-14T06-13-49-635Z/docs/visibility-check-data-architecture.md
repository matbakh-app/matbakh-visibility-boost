# 📊 Visibility Check Data Architecture - Developer Documentation

## Overview
This document explains the data architecture for the Enhanced Visibility Check system in matbakh.app, designed for scalable, AI-driven business analysis and report generation.

## 🎯 Core Principles

### 1. **Lead-Centric Architecture**
Every analysis, recommendation, and report is tied to a `visibility_check_leads` record. This ensures:
- Complete traceability from initial contact to conversion
- GDPR compliance through clear data ownership
- Seamless monetization (free → paid reports → service upsells)
- KI training data with proper consent tracking

### 2. **Separation of Concerns**
```
Lead Generation → Analysis → Results → Reports → Conversion
     ↓              ↓          ↓         ↓          ↓
  leads table → functions → results → PDF/UI → partners
```

### 3. **Future-Proof Data Structure**
- JSONB fields for flexible analysis results
- Support for new platforms, metrics, and AI models
- Extensible without breaking changes

## 🗂️ Database Schema

### Core Tables

#### `visibility_check_leads`
**Purpose**: Central hub for all visibility check requests and user interactions.

**Key Fields**:
- `id`: Unique identifier for the entire analysis process
- `email`: User contact (required for reports and follow-up)
- `business_name`, `location`: Basic business info for analysis
- `status`: Workflow tracking (`pending` → `analyzing` → `completed`/`failed`)
- `consent_given`: GDPR compliance flag
- `analysis_error_message`: Error tracking for debugging
- `created_at`, `updated_at`: Audit trail timestamps

**Design Rationale**:
- Email-based identification allows anonymous starts with later conversion
- Status field enables real-time progress tracking
- Error logging supports automated retry mechanisms
- Timestamps crucial for GDPR retention policies

#### `visibility_check_results`
**Purpose**: Persistent storage of all analysis outputs for reports and recommendations.

**Key Fields**:
- `lead_id`: Foreign key linking to originating request (CASCADE DELETE)
- `overall_score`: Numeric score (0-100) for ranking and comparison
- `platform_analyses`: JSONB array of detailed platform breakdowns
- `benchmarks`: JSONB comparison data vs. industry standards
- `category_insights`: JSONB business-specific recommendations
- `quick_wins`: JSONB actionable improvement suggestions
- `instagram_candidates`: JSONB auto-detected social profiles
- `analysis_results`: JSONB complete raw analysis for future processing

**Design Rationale**:
- JSONB allows flexible schema evolution as AI models improve
- Separate fields for UI components (scores, quick wins) vs. raw data
- Foreign key ensures referential integrity and cleanup
- Structure supports both immediate display and future AI training

## 🔒 Security & Access Control

### Row Level Security (RLS) Policies

#### For `visibility_check_results`:
```sql
-- Users can view results for their own leads
CREATE POLICY "Users can view their own visibility results" 
ON visibility_check_results FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM visibility_check_leads l 
    WHERE l.id = visibility_check_results.lead_id 
    AND (l.user_id = auth.uid() OR l.email = (auth.jwt() ->> 'email'))
  )
);

-- System can manage all results for automation
CREATE POLICY "System can manage all visibility results" 
ON visibility_check_results FOR ALL 
USING (auth.role() = 'service_role');
```

**Security Philosophy**:
- Lead ownership via user_id OR email (supports anonymous → registered flow)
- Service role for backend automation (analysis functions, cleanup)
- No direct admin access to results (privacy by design)

## 🚀 Performance Optimizations

### Strategic Indexing
```sql
-- Core lookup patterns
CREATE INDEX idx_visibility_check_results_lead_id ON visibility_check_results(lead_id);
CREATE INDEX idx_visibility_check_results_created_at ON visibility_check_results(created_at);
CREATE INDEX idx_visibility_check_leads_status ON visibility_check_leads(status);
CREATE INDEX idx_visibility_check_leads_email ON visibility_check_leads(email);
```

**Indexing Strategy**:
- `lead_id`: Fast result lookup for PDF generation and UI display
- `created_at`: Efficient sorting for latest results and cleanup queries
- `status`: Quick filtering for workflow automation
- `email`: Rapid lead lookup during user authentication

## 🔄 Data Flow Architecture

### 1. Lead Creation
```
User Input → visibility_check_leads (status: 'pending')
         → Optional: Link to user_id if authenticated
         → Consent tracking
```

### 2. Analysis Execution
```
Double Opt-In → Enhanced Visibility Check Function
            → Status update: 'analyzing'
            → External API calls (Google, Meta, etc.)
            → Result processing
```

### 3. Result Persistence
```
Analysis Complete → visibility_check_results INSERT
                → Status update: 'completed'
                → PDF generation trigger
                → Email notification
```

### 4. Error Handling
```
Analysis Failure → Status update: 'failed'
               → Error message logging
               → Retry mechanism
               → Support notification
```

## 🧠 AI & Machine Learning Integration

### Training Data Structure
The JSONB fields support ML model training:
- `analysis_results`: Raw feature data for model inputs
- `platform_analyses`: Structured scoring for supervised learning
- `benchmarks`: Comparative data for ranking algorithms
- User interactions tracked via status changes and timestamps

### Model Evolution Support
- Schema allows adding new analysis fields without migration
- Versioning possible through metadata in JSONB
- A/B testing supported through parallel result storage

## 💰 Monetization Architecture

### Revenue Stream Support
1. **Free Reports**: Basic analysis with upgrade prompts
2. **Paid Detailed Reports**: Full analysis with competitive insights
3. **Service Upsells**: Lead conversion to business_partners table
4. **Recurring Analytics**: Ongoing monitoring subscriptions

### Conversion Tracking
```sql
-- Lead to customer conversion
UPDATE visibility_check_leads 
SET converted_to_partner_id = new_partner.id 
WHERE email = customer_email;
```

## 📋 Maintenance & Operations

### Data Retention
- Results kept for AI training and user history
- GDPR-compliant deletion via CASCADE relationships
- Automatic cleanup of old analysis data (configurable)

### Monitoring Points
- Analysis success/failure rates by status field
- Performance metrics via timestamps
- Error patterns via analysis_error_message
- User conversion funnel via status transitions

## 🔄 Future Extensions

### Planned Enhancements
1. **Multi-location Analysis**: Array of business locations
2. **Competitor Tracking**: Automated competitive monitoring
3. **Trend Analysis**: Historical score tracking
4. **Custom Metrics**: Industry-specific KPIs
5. **API Access**: Third-party integrations

### Schema Evolution
The JSONB-based design supports:
- New analysis providers without schema changes
- Custom scoring algorithms per industry
- Enhanced AI recommendations
- Real-time data streaming

## 🚨 Critical Implementation Notes

### Required for Production
1. **Backup Strategy**: Regular snapshots of results for ML training
2. **GDPR Compliance**: Automated deletion workflows
3. **Rate Limiting**: Prevent analysis abuse
4. **Error Alerting**: Failed analysis monitoring
5. **Data Validation**: JSON schema validation for analysis results

### Development Guidelines
- Always use transactions for lead + result operations
- Validate JSONB structure before insertion
- Handle race conditions in status updates
- Test RLS policies with different user types
- Monitor query performance with EXPLAIN ANALYZE

---

## Summary

This architecture provides a robust foundation for:
- ✅ Scalable analysis workflows
- ✅ GDPR-compliant data management  
- ✅ Real-time progress tracking
- ✅ Flexible AI/ML integration
- ✅ Multiple monetization models
- ✅ Future feature expansion

The design balances immediate operational needs with long-term strategic goals, ensuring matbakh.app can evolve from a simple visibility checker to a comprehensive business intelligence platform.