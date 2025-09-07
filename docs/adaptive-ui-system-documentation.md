# Adaptive UI System & Leistungsportfolio Integration

## Overview

The Adaptive UI System is a comprehensive solution that automatically adjusts the dashboard interface based on available AI services and user personas. This system implements progressive feature disclosure, ensuring users only see features they can access and use.

## Architecture

### Core Components

#### 1. AI Service Manager (`src/services/ai-service-manager.ts`)
- **Purpose**: Central orchestrator for AI service availability and capabilities
- **Features**:
  - Real-time service health monitoring
  - Capability detection and management
  - Persona-based service filtering
  - Automatic service discovery

#### 2. useAIServices Hook (`src/hooks/useAIServices.ts`)
- **Purpose**: React hook for AI service management and adaptive UI
- **Features**:
  - Service portfolio management
  - Operation status tracking
  - Persona integration
  - UI helper functions

#### 3. Adaptive Dashboard Grid (`src/components/dashboard/AdaptiveDashboardGrid.tsx`)
- **Purpose**: Main dashboard component that adapts based on available services
- **Features**:
  - Dynamic widget loading
  - Persona-based prioritization
  - Progressive feature disclosure
  - Responsive layout adaptation

### AI-Powered Widgets

#### 1. AI Recommendations Widget
- **File**: `src/components/dashboard/widgets/AIRecommendationsWidget.tsx`
- **Purpose**: Displays AI-generated business recommendations
- **Features**:
  - Persona-specific recommendations
  - ROI projections (non-binding)
  - Priority-based sorting
  - Actionable insights

#### 2. AI Analysis Widget
- **File**: `src/components/dashboard/widgets/AIAnalysisWidget.tsx`
- **Purpose**: Shows AI-powered business analysis results
- **Features**:
  - SWOT analysis
  - Competitive insights
  - Strategic frameworks
  - Confidence scoring

#### 3. AI Content Widget
- **File**: `src/components/dashboard/widgets/AIContentWidget.tsx`
- **Purpose**: AI-powered content generation for social media
- **Features**:
  - Multi-platform content (Instagram, Facebook, Google Posts)
  - Persona-adapted tone and complexity
  - Hashtag suggestions
  - Image prompts

#### 4. AI Insights Widget
- **File**: `src/components/dashboard/widgets/AIInsightsWidget.tsx`
- **Purpose**: Displays AI-generated business insights and trends
- **Features**:
  - Persona detection results
  - Behavioral pattern analysis
  - Trend identification
  - Strategic insights

#### 5. AI Status Widget
- **File**: `src/components/dashboard/widgets/AIStatusWidget.tsx`
- **Purpose**: Shows real-time AI operation status and service health
- **Features**:
  - Active operation monitoring
  - Service health indicators
  - Performance metrics
  - System status overview

#### 6. Persona Selection Widget
- **File**: `src/components/dashboard/widgets/PersonaSelectionWidget.tsx`
- **Purpose**: Allows users to select their business persona
- **Features**:
  - Four persona types (Solo-Sarah, Bewahrer-Ben, Wachstums-Walter, Ketten-Katrin)
  - Persona-specific feature recommendations
  - Adaptive complexity levels
  - Real-time persona switching

## Persona System

### Supported Personas

#### 1. Solo-Sarah (Simple)
- **Target**: Individual restaurant owners
- **Characteristics**: Time-pressed, prefers simple solutions
- **AI Features**: Basic recommendations, step-by-step guidance
- **UI Adaptations**: Simplified interface, no beta features

#### 2. Bewahrer-Ben (Moderate)
- **Target**: Traditional restaurant owners
- **Characteristics**: Conservative, values proven methods
- **AI Features**: Conservative recommendations, detailed analysis
- **UI Adaptations**: Detailed reports, proven strategies focus

#### 3. Wachstums-Walter (Advanced)
- **Target**: Growth-oriented restaurant owners
- **Characteristics**: Technology-savvy, expansion-focused
- **AI Features**: All features, beta access, advanced analytics
- **UI Adaptations**: Full feature set, complex analyses

#### 4. Ketten-Katrin (Advanced)
- **Target**: Chain/franchise managers
- **Characteristics**: Multi-location focus, standardization needs
- **AI Features**: Multi-location analysis, benchmarking
- **UI Adaptations**: Comparison tools, standardized processes

## Service Portfolio Management

### Service Types

#### 1. Bedrock AI Core
- **Provider**: AWS Bedrock (Claude 3.5 Sonnet)
- **Capabilities**:
  - Visibility Check Analysis
  - Persona Detection
  - Content Generation (Beta)
  - Business Recommendations
  - Competitive Analysis (Beta)

#### 2. Gemini AI (Future)
- **Provider**: Google Gemini
- **Capabilities**:
  - Image Analysis (Beta)
  - Multilingual Content (Beta)

### Health Monitoring

The system continuously monitors service health through:
- **Health Checks**: Periodic API calls to verify service availability
- **Performance Metrics**: Response time and success rate tracking
- **Error Monitoring**: Automatic error detection and reporting
- **Fallback Systems**: Graceful degradation when services are unavailable

## Progressive Feature Disclosure

### Principles

1. **Service-Based Visibility**: Features only appear when underlying services are available
2. **Permission-Based Access**: User roles and feature flags control access
3. **Persona-Based Prioritization**: Widget order and complexity adapt to user persona
4. **Graceful Degradation**: System remains functional even when AI services are unavailable

### Implementation

```typescript
// Example: Widget visibility logic
const shouldShowWidget = (widgetId: string): boolean => {
  // Check feature flags
  if (!WIDGET_FEATURE_FLAGS[widgetId]) return false;
  
  // Check user permissions
  if (!hasRequiredFeatures(widgetId)) return false;
  
  // Check AI capabilities
  if (!hasRequiredCapabilities(widgetId)) return false;
  
  // Check persona compatibility
  if (!isPersonaCompatible(widgetId, currentPersona)) return false;
  
  return true;
};
```

## Real-Time Operation Status

### Operation Types

1. **Analysis Operations**: SWOT, competitive analysis, insights generation
2. **Content Operations**: Social media post generation, content optimization
3. **Recommendation Operations**: Business recommendation generation

### Status Tracking

- **Pending**: Operation queued but not started
- **Running**: Operation in progress with progress percentage
- **Completed**: Operation finished successfully
- **Error**: Operation failed with error details

### User Experience

- **Progress Indicators**: Real-time progress bars and status messages
- **Estimated Completion**: Time estimates for long-running operations
- **Background Processing**: Non-blocking operations with notifications
- **Error Handling**: User-friendly error messages with retry options

## Integration Points

### Feature Flags Integration

The system integrates with the existing feature flag system:

```sql
-- Example feature flags
INSERT INTO feature_flags (flag_name, enabled, value) VALUES
('vc_bedrock_live', true, 'true'),
('vc_bedrock_rollout_percent', true, '100'),
('ai_content_generation', true, 'true'),
('ai_competitive_analysis', false, 'false');
```

### User Access Control

Integration with the existing RBAC system:

```typescript
// Example access control
const hasAIAccess = hasFeature('ai_analysis') || hasFeature('premium_features');
const canUseAdvancedFeatures = hasRole('admin') || hasRole('business_partner');
```

### Dashboard Integration

The adaptive system integrates with existing dashboard components:

- **Existing Widgets**: Core business widgets (visibility score, reviews, orders)
- **AI Widgets**: New AI-powered widgets that enhance existing functionality
- **Layout System**: Responsive grid that adapts to available widgets

## Configuration

### Environment Variables

```env
# AI Service Configuration
VITE_AI_SERVICES_ENABLED=true
VITE_BEDROCK_ENDPOINT=https://bedrock-runtime.eu-central-1.amazonaws.com
VITE_AI_HEALTH_CHECK_INTERVAL=300000  # 5 minutes

# Feature Flags
VITE_AI_CONTENT_GENERATION=true
VITE_AI_COMPETITIVE_ANALYSIS=false
VITE_PERSONA_DETECTION=true
```

### Service Configuration

```typescript
// AI Service Configuration
const AI_SERVICE_CONFIG = {
  bedrock: {
    region: 'eu-central-1',
    model: 'anthropic.claude-3-5-sonnet-20240620-v1:0',
    maxTokens: 4096,
    temperature: 0.7
  },
  healthCheck: {
    interval: 5 * 60 * 1000, // 5 minutes
    timeout: 30 * 1000,      // 30 seconds
    retries: 3
  }
};
```

## Usage Examples

### Basic Implementation

```typescript
import { useAIServices } from '@/hooks/useAIServices';
import AdaptiveDashboardGrid from '@/components/dashboard/AdaptiveDashboardGrid';

function MyDashboard() {
  const { currentPersona, hasCapability } = useAIServices();
  
  return (
    <div>
      <h1>Dashboard for {currentPersona}</h1>
      <AdaptiveDashboardGrid 
        userRole="user"
        compactMode={false}
        showPersonaSelector={true}
      />
    </div>
  );
}
```

### Custom Widget Integration

```typescript
import { useAIServices } from '@/hooks/useAIServices';

function CustomWidget() {
  const { hasCapability, startOperation, completeOperation } = useAIServices();
  
  if (!hasCapability('custom_analysis')) {
    return <div>Feature not available</div>;
  }
  
  const handleAnalysis = async () => {
    const opId = startOperation('analysis', 'Running custom analysis...');
    try {
      // Perform analysis
      await performAnalysis();
      completeOperation(opId, 'Analysis completed');
    } catch (error) {
      completeOperation(opId, 'Analysis failed');
    }
  };
  
  return (
    <div>
      <button onClick={handleAnalysis}>Run Analysis</button>
    </div>
  );
}
```

## Testing

### Unit Tests

```typescript
// Example test for AI service manager
describe('AIServiceManager', () => {
  it('should detect available services', async () => {
    const portfolio = await aiServiceManager.getServicePortfolio();
    expect(portfolio.services).toBeDefined();
    expect(portfolio.activeServices).toBeGreaterThanOrEqual(0);
  });
  
  it('should filter capabilities by persona', () => {
    const capabilities = aiServiceManager.getPersonaCapabilities('Solo-Sarah');
    expect(capabilities).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'vc_analysis' })
      ])
    );
  });
});
```

### Integration Tests

```typescript
// Example integration test
describe('Adaptive Dashboard', () => {
  it('should show appropriate widgets for persona', () => {
    render(<AdaptiveDashboardGrid />);
    
    // Should show basic widgets for Solo-Sarah
    expect(screen.getByText('KI-Empfehlungen')).toBeInTheDocument();
    expect(screen.queryByText('Erweiterte Analyse')).not.toBeInTheDocument();
  });
});
```

## Performance Considerations

### Optimization Strategies

1. **Lazy Loading**: Widgets are loaded only when needed
2. **Memoization**: Expensive calculations are cached
3. **Debounced Updates**: Service health checks are debounced
4. **Progressive Enhancement**: Core functionality works without AI services

### Monitoring

- **Service Response Times**: Track AI service performance
- **Widget Load Times**: Monitor dashboard rendering performance
- **Error Rates**: Track service failures and fallbacks
- **User Engagement**: Monitor feature usage by persona

## Security

### Data Protection

- **PII Redaction**: Automatic removal of sensitive data from logs
- **Secure Communication**: All AI service calls use HTTPS
- **Access Control**: Role-based access to AI features
- **Audit Logging**: Comprehensive logging of AI operations

### Privacy Compliance

- **GDPR Compliance**: User data handling follows GDPR requirements
- **Data Retention**: Automatic cleanup of old AI operation logs
- **User Consent**: Clear consent for AI feature usage
- **Data Minimization**: Only necessary data is sent to AI services

## Troubleshooting

### Common Issues

#### 1. No AI Widgets Visible
- **Cause**: Missing feature flags or user permissions
- **Solution**: Check feature flags and user access levels

#### 2. Service Health Issues
- **Cause**: AI service unavailability or network issues
- **Solution**: Check service status and network connectivity

#### 3. Persona Detection Not Working
- **Cause**: Missing persona detection capability
- **Solution**: Verify AI service configuration and capabilities

### Debug Mode

Enable debug mode to see detailed information:

```typescript
// Enable debug mode
localStorage.setItem('ai_debug', 'true');

// View service portfolio
console.log(await aiServiceManager.getServicePortfolio());
```

## Future Enhancements

### Planned Features

1. **Multi-Provider Support**: Support for multiple AI providers simultaneously
2. **Custom Personas**: User-defined persona types
3. **Advanced Analytics**: Detailed usage analytics and optimization
4. **API Integration**: External API access for third-party integrations
5. **Mobile Optimization**: Enhanced mobile experience for AI features

### Roadmap

- **Q1 2025**: Gemini integration, image analysis capabilities
- **Q2 2025**: Custom persona creation, advanced analytics
- **Q3 2025**: Multi-location support, enterprise features
- **Q4 2025**: Third-party integrations, API access

## Conclusion

The Adaptive UI System provides a robust, scalable foundation for AI-powered features in the matbakh.app dashboard. By automatically adapting to available services and user personas, it ensures an optimal user experience while maintaining system reliability and performance.

The system's modular architecture allows for easy extension and integration of new AI capabilities, making it future-proof and adaptable to changing business requirements.