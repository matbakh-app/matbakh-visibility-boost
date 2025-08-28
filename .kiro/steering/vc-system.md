# Visibility Check System - Comprehensive Guide

## System Overview

The Visibility Check (VC) is matbakh.app's core feature - a comprehensive digital presence analysis system for restaurants and hospitality businesses. It transforms from a simple email-based entry point into a sophisticated business intelligence platform.

## Core Architecture

### Data Flow
1. **Lead Generation**: `/vc/quick` → email capture → DOI process
2. **Analysis Engine**: AWS Bedrock/Claude AI → multi-platform data collection
3. **Results Processing**: Structured scoring → SWOT analysis → actionable recommendations
4. **Dashboard Integration**: Widget-based display → persona-specific outputs
5. **Conversion Funnel**: Free analysis → detailed reports → service upsells

### Database Schema
- `visibility_check_leads`: Central hub for all VC requests
- `visibility_check_results`: Persistent analysis outputs with JSONB flexibility
- `unclaimed_business_profiles`: Business data for claim process
- `gmb_categories`: Standardized business categorization

## 100% VC Output Capabilities

### Comprehensive Visibility Score
- **Overall Score**: 0-100 with weighted platform contributions
- **Platform Breakdown**: Google (40%), Social (30%), Website (20%), Other (10%)
- **Trend Analysis**: Historical performance with predictive insights via Google Trends
- **Benchmark Comparison**: Local competitors, industry average, top 10%

### Multi-Platform Intelligence
- **Google Ecosystem**: GMB completeness, reviews, photos, posts, local rankings
- **Google Trends**: Seasonal search volume patterns and local gastronomy trends
- **Social Media**: Facebook, Instagram, TikTok activity and engagement metrics
- **Review Platforms**: Tripadvisor, Yelp coverage and sentiment analysis
- **Website Analytics**: SEO performance, traffic patterns, conversion tracking
- **OnPal Integration**: Local events and venue calendar data
- **Public Data**: Industry statistics, local economic data, competitive analysis

### Strategic Framework Integration
- **SWOT Analysis**: Automated strengths/weaknesses/opportunities/threats identification
- **Porter's Five Forces**: Competitive positioning analysis
- **Balanced Scorecard**: Multi-dimensional performance evaluation
- **Nutzwertanalyse**: ROI prioritization with revenue projections (always non-binding)
- **Cultural Dimensions**: Hofstede framework for regional communication adaptation

### Actionable Intelligence Matrix
- **Quick Wins**: Immediate impact actions with effort estimates and revenue projections
- **Strategic Initiatives**: Long-term improvements with timeline projections
- **Seasonal Opportunities**: Time-sensitive recommendations based on Google Trends
- **One-Click Actions**: AI-generated content → user refinement → approval → multi-channel posting

### Content Automation Categories
- **Content-Storytelling**: AI-generated posts based on SWOT strengths
- **Bilder-Storytelling**: Photo gap analysis with specific shooting recommendations
- **Video Integration**: YouTube/TikTok optimization (future: Note-LLM integration)
- **Multi-Channel Orchestration**: Google MB, Facebook, Instagram synchronized posting

### Revenue Impact Communication
- **Gastronomy Language**: Business terms translated to restaurant owner vocabulary
- **Traffic Light System**: 🟢 Excellent, 🟠 Needs improvement, 🔴 Urgent action
- **Euro Projections**: "This action could bring ~500€ more revenue" (always non-binding)
- **Time Investment**: "15 minutes work for 3 months better visibility"

## Persona-Based Output Adaptation

### "Der Zeitknappe" (Time-Pressed Owner)
- 30-second summary with score and top 3 actions
- Mobile-optimized quick view
- Push notifications for critical issues

### "Der Überforderte" (Overwhelmed Beginner)
- Simplified interface with guided workflows
- Step-by-step tutorials
- Clear next action buttons

### "Der Skeptiker" (Data-Driven Skeptic)
- Detailed metrics and proof points
- Competitive comparisons
- Source attribution for all claims

### "Der Profi" (Marketing Professional)
- Complete data exports (CSV, PDF, API)
- Advanced analytics and custom reports
- White-label options for agencies

## Technical Implementation

### API Integration
- **Provider**: AWS (VITE_VC_API_PROVIDER=aws)
- **Endpoint**: POST /vc/start for lead generation
- **Authentication**: Email-based with DOI confirmation
- **Rate Limiting**: Prevent abuse while maintaining UX

### Frontend Components
- `VCQuick.tsx`: Entry point with email capture
- `VCResult.tsx`: Results display with error handling
- `VisibilityDashboard`: Comprehensive analytics view
- Widget system for modular dashboard composition

### AI/ML Integration
- **Analysis Engine**: AWS Bedrock with Claude for natural language processing
- **Prompt Engineering**: Structured prompts for consistent analysis quality
- **Training Data**: Results stored for continuous model improvement
- **Multilingual**: German (primary) and English support

## Monetization Strategy

### Tier Structure
1. **Free VC Quick**: Basic analysis with upgrade prompts
2. **Detailed Reports**: Comprehensive analysis with competitive insights
3. **Dashboard Access**: Ongoing monitoring and recommendations
4. **Service Upsells**: Conversion to business_partners for full service

### Conversion Tracking
- Lead to customer journey mapping
- Feature usage analytics
- A/B testing for optimization
- Revenue attribution per VC lead

## Quality Assurance

### Testing Requirements
- Healthcheck script for CDN/SPA behavior
- Error state handling for all failure modes
- Mobile responsiveness across devices
- i18n validation for DE/EN content

### Performance Standards
- < 3 seconds for initial page load
- < 30 seconds for analysis completion
- 99.9% uptime for VC endpoints
- GDPR compliance for all data handling

## Future Enhancements

### Planned Features
- Multi-location analysis for chains
- Competitor tracking automation
- Custom industry metrics
- API access for third-party integrations
- Real-time monitoring alerts

### Scalability Considerations
- JSONB schema for flexible data evolution
- Microservices architecture for component scaling
- CDN optimization for global performance
- Database partitioning for large datasets

## Development Guidelines

### Code Standards
- TypeScript strict mode for all VC components
- Comprehensive error handling with user-friendly messages
- Analytics tracking for all user interactions
- Accessibility compliance (WCAG 2.1 AA)

### Security Requirements
- Row Level Security (RLS) for data access
- Input validation and sanitization
- Rate limiting and abuse prevention
- Audit logging for compliance

This system represents the evolution from simple visibility checking to comprehensive business intelligence, positioning matbakh.app as the definitive platform for hospitality digital presence management.