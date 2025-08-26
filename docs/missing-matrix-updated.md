# Missing Matrix - Updated (P0/P1/P2)

## P0 (Critical - Blocks Core Functionality)

### 1. Google Business Profile API Configuration
- **Source**: Google Cloud Console > APIs & Credentials
- **Missing**: API enablement, service account permissions for GBP API
- **Impact**: Core VC functionality blocked, Day-1 onboarding step fails
- **Required for**: Progressive onboarding Tag 1 (GBP verbinden)
- **Acceptance**: 95% of Solo-Sarah flows deliver VC without manual intervention

### 2. SES Configuration for DOI/DSGVO Compliance
- **Source**: AWS Console > SES
- **Missing**: 
  - Configuration Set "matbakh-default" with List-Unsubscribe headers
  - One-Click-Unsubscribe functionality
  - DOI email templates (DE/EN) with all legal requirements
- **Impact**: Legal compliance blocked, no email reports possible
- **Required for**: DSGVO/DOI-Block, all email communication
- **Acceptance**: DOI-Rate ≥ 90%, One-Click-Unsubscribe functional

### 3. DynamoDB Tables for Onboarding
- **Source**: AWS Console > DynamoDB
- **Missing**: 
  - `OnboardingProgress` table (pk=email_lower, sk=step#date, TTL)
  - Enhanced `VcTokens` schema with consent fields
  - `ConsentJournal` table (P1, but schema needed)
- **Impact**: Progressive onboarding tracking impossible
- **Required for**: 14-day progressive flow, consent documentation
- **Acceptance**: All onboarding progress trackable, audit-ready consent records

### 4. Persona-Erkennung Heuristik Implementation
- **Source**: Backend Logic / Supabase Edge Functions
- **Missing**: 
  - 5-question scoring algorithm
  - Persona mapping logic (Solo-Sarah, Bewahrer-Ben focus)
  - Fallback to Solo-Sarah when uncertain
- **Impact**: No personalized onboarding flows
- **Required for**: Adaptive onboarding experience
- **Acceptance**: Persona assignment works, manual override possible

## P1 (High - Impacts User Experience)

### 5. GA4 Integration for Progressive Onboarding
- **Source**: Google Analytics Data API
- **Missing**: 
  - Service account permissions for GA4 property 495696125
  - Basic KPI extraction and dashboard integration
  - Error handling for invalid/missing GA4 IDs
- **Impact**: Tag 2 onboarding step incomplete, reduced value proposition
- **Required for**: Progressive onboarding Tag 2 (GA4 verbinden)
- **Acceptance**: GA4 connection works for valid IDs, graceful fallback for invalid

### 6. Image Upload and Processing
- **Source**: Supabase Storage / CDN
- **Missing**: 
  - Logo/profile photo upload functionality
  - Image optimization and resizing
  - Quality score calculation based on images
- **Impact**: Tag 3 onboarding step missing, visual improvements not trackable
- **Required for**: Progressive onboarding Tag 3 (Logo/Fotos hochladen)
- **Acceptance**: Image upload works, quality score updates visibly

### 7. Social Media Integration (Instagram/Facebook)
- **Source**: Meta APIs / Instagram Basic Display
- **Missing**: 
  - Instagram connection workflow
  - Facebook page linking
  - Social media data extraction for VC
- **Impact**: Tag 5 onboarding step incomplete, social presence not analyzed
- **Required for**: Progressive onboarding Tag 5 (Social-Links verbinden)
- **Acceptance**: Social connections work, data flows into VC analysis

### 8. Enhanced Visibility Check Engine
- **Source**: AWS Bedrock / Custom Analysis
- **Missing**: 
  - Competitor analysis automation
  - Local SEO scoring improvements
  - Performance benchmarking against similar businesses
- **Impact**: VC results less comprehensive, lower differentiation
- **Required for**: Improved VC quality, better insights
- **Acceptance**: VC provides actionable insights, competitor data included

## P2 (Medium - Nice to Have)

### 9. Advanced Analytics and Reporting
- **Source**: Custom Dashboard / BI Tools
- **Missing**: 
  - Weekly/monthly progress reports
  - Trend analysis over time
  - Industry benchmarking data
- **Impact**: Limited long-term value, reduced retention
- **Required for**: Long-term customer engagement
- **Acceptance**: Regular reports generated, trends visible

### 10. Multi-Language Support Beyond DE/EN
- **Source**: i18n System Extension
- **Missing**: 
  - French, Italian, Spanish translations
  - Localized business categories
  - Regional compliance variations
- **Impact**: Limited market expansion
- **Required for**: International expansion
- **Acceptance**: Additional languages work correctly

### 11. Advanced Persona Flows (Wachstums-Walter, Ketten-Katrin)
- **Source**: Extended Onboarding Logic
- **Missing**: 
  - Multi-location management interface
  - Enterprise integration capabilities
  - Account manager assignment workflows
- **Impact**: Cannot serve larger customers effectively
- **Required for**: Market expansion to larger businesses
- **Acceptance**: Advanced personas have functional flows

### 12. POS System Integrations
- **Source**: Third-party APIs (Toast, Square, etc.)
- **Missing**: 
  - POS system connectors
  - Transaction data analysis
  - Revenue attribution modeling
- **Impact**: Limited data depth, reduced insights quality
- **Required for**: Advanced business intelligence
- **Acceptance**: POS data flows into analytics

## Implementation Priority

### Sprint 1 (P0 - Weeks 1-2)
1. SES DOI/DSGVO setup
2. DynamoDB tables creation
3. Persona-Erkennung heuristik
4. GBP API configuration

### Sprint 2 (P0 + P1 - Weeks 3-4)
1. Progressive onboarding Day-0 flow
2. GA4 integration (Tag 2)
3. Image upload (Tag 3)
4. Enhanced VC engine

### Sprint 3 (P1 + P2 - Weeks 5-6)
1. Social media integration (Tag 5)
2. Advanced analytics
3. Multi-language support
4. Advanced persona flows

## Risk Mitigation

### API Dependencies
- **Risk**: Google/Meta API changes or rate limits
- **Mitigation**: Cached data, graceful degradation, mock modes

### Performance Requirements
- **Risk**: < 3 Min TTV not achievable
- **Mitigation**: Async processing, progressive loading, cached results

### Legal Compliance
- **Risk**: DSGVO violations, consent issues
- **Mitigation**: Legal review, audit trails, explicit consent flows

### Scalability
- **Risk**: System cannot handle user growth
- **Mitigation**: Auto-scaling, performance monitoring, load testing

## Success Metrics

### P0 Success Criteria
- Day-0 Completion ≥ 80%
- DOI-Rate ≥ 90%
- TTV < 3 Min for Solo-Sarah
- 95% VC delivery without manual intervention

### P1 Success Criteria
- 14-Tage Retention-Onboarding ≥ 50%
- GA4 connection success rate ≥ 70%
- Image upload completion ≥ 60%
- Social media connection ≥ 40%

### P2 Success Criteria
- Advanced persona adoption ≥ 20%
- Multi-language usage ≥ 10%
- POS integration adoption ≥ 15%
- Advanced analytics engagement ≥ 30%