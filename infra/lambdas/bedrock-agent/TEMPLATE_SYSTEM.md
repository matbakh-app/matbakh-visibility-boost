# Bedrock AI Core - Prompt Contract Template System

## Overview

The Prompt Contract Template System is a comprehensive framework for managing AI prompts with embedded security guards, dynamic composition, and version control. It provides a secure, flexible, and extensible foundation for all AI operations in the matbakh.app platform.

## 🏗️ Architecture

### Core Components

1. **Template Registry** - Central management of all prompt templates
2. **Security Validation** - Ensures all templates meet security requirements
3. **Dynamic Composition** - Builds prompts based on context and user persona
4. **Version Control** - Manages template versions with rollback capabilities
5. **VC Integration** - Seamless integration with existing Visibility Check system

### Template Types

- **VC Analysis Template** - Comprehensive business analysis with SWOT, Porter's Five Forces, Balanced Scorecard
- **Content Generation Template** - Multi-platform content creation for social media and marketing
- **Persona Detection Template** - Automatic user classification into 4 main personas
- **Text Rewrite Template** - Content optimization and improvement

## 🔐 Security Framework

### Security Guards (Non-Removable)

Every template includes embedded security guards that cannot be bypassed:

```typescript
🔐 SICHERHEITSKONTEXT (NICHT ENTFERNBAR):
Du arbeitest im Kontext der Matbakh.app...

📋 ERLAUBTE AKTIONEN:
✅ Webanfragen zu öffentlichen Datenquellen (über Lambda-Proxy)
✅ Nutzerfreundliche Hinweise und weiterführende Tipps ergänzen

🚫 VERBOTENE AKTIONEN (NICHT ÜBERSCHREIBBAR):
❌ Sensible oder personenbezogene Daten speichern oder weiterleiten
❌ Nicht-freigegebene APIs direkt aufrufen
❌ Datenbanken ohne explizite Freigabe verändern
```

### Validation Layers

1. **Template Structure Validation** - Ensures required sections are present
2. **Content Security Validation** - Scans for forbidden patterns and injection attempts
3. **Variable Validation** - Validates input variables and detects PII
4. **Contract Compliance** - Ensures templates comply with security contracts

## 🎯 Usage Examples

### VC Analysis with Template

```typescript
import { VCTemplateBuilder } from './vc-template-integration';

const builder = new VCTemplateBuilder('Der Profi');
const prompt = builder.buildAnalysisPrompt(leadData, contextData);

// Prompt includes:
// - Security guards
// - SWOT analysis framework
// - Porter's Five Forces
// - Balanced Scorecard
// - Content strategy recommendations
```

#### Tokenkosten
Beispielhafte Token-Kosten je Template können im Monitoring-Dashboard eingesehen werden. Geplante Erweiterung: Prompt-Cost Optimization Layer mit automatischer Kostenoptimierung basierend auf Performance-Metriken.

### Content Generation

```typescript
import { ContentGenerationTemplate } from './prompt-templates';

const template = new ContentGenerationTemplate(contract);
const prompt = template.generate({
  content_type: 'social_media',
  business_name: 'Ristorante Bella Vista',
  brand_voice: 'freundlich und einladend',
  target_audience: 'Familien und Berufstätige'
});
```

### Persona Detection

```typescript
import { PersonaDetectionTemplate } from './prompt-templates';

const template = new PersonaDetectionTemplate(contract);
const prompt = template.generate({
  user_responses: 'Ich brauche konkrete Zahlen und Belege...',
  user_language: 'de'
});

// Returns JSON with:
// - primary_persona: "Der Skeptiker|Der Überforderte|Der Profi|Der Zeitknappe"
// - confidence_score: 0.85
// - communication_recommendations
```

## 👥 Persona System

### Four Main Personas

1. **"Der Skeptiker"** (The Skeptic)
   - Needs concrete proof and data
   - Communication: Detailed, factual, transparent
   - Template adaptations: More metrics, source attribution

2. **"Der Überforderte"** (The Overwhelmed)
   - Needs simplicity and guidance
   - Communication: Simple, step-by-step, encouraging
   - Template adaptations: Simplified language, clear structure

3. **"Der Profi"** (The Professional)
   - Needs depth and technical details
   - Communication: Technical, comprehensive, strategic
   - Template adaptations: Advanced analytics, export options

4. **"Der Zeitknappe"** (The Time-Pressed)
   - Needs speed and efficiency
   - Communication: Brief, actionable, prioritized
   - Template adaptations: Quick wins, bullet points, time estimates

## 🔄 Version Control & Rollback

### Template Versioning

```typescript
// Create new version
templateRegistry.createVersion(
  'vc_analysis_v1',
  '1.1.0',
  'Added seasonal analysis support',
  templateContent,
  'standard'
);

// Rollback to previous version
rollbackManager.rollbackTemplate(
  'vc_analysis_v1',
  '1.0.0',
  'Critical security issue in v1.1.0'
);
```

### Rollback Safety

- Automatic security validation before rollback
- Prevents rollback to versions with critical security issues
- Maintains audit trail of all version changes

## 🔗 VC System Integration

### Seamless Integration with Existing Endpoints

The template system integrates with existing VC API endpoints:

- `/vc/start` - Enhanced with persona hints
- `/vc/result` - Powered by AI analysis templates
- Token system - Maintains compatibility with existing VC tokens

### Data Flow

```
VC Lead Data → Template Builder → Secure Prompt → Claude → Structured Result → VC Dashboard
```

### Enhanced Features

- **Persona-adaptive responses** based on user behavior
- **Dynamic data quality scoring** for better analysis
- **Structured output parsing** for consistent results
- **Multi-framework analysis** (SWOT, Porter's, Balanced Scorecard)

## 📊 Template Variables

### Common Variables

```typescript
interface TemplateVariables {
  // User context
  user_persona?: 'Der Skeptiker' | 'Der Überforderte' | 'Der Profi' | 'Der Zeitknappe';
  user_language?: 'de' | 'en';
  user_experience_level?: 'beginner' | 'intermediate' | 'expert';
  
  // Business context
  business_name?: string;
  business_category?: string;
  business_location?: string;
  business_profile?: Record<string, any>;
  
  // Analysis context
  goals?: string[];
  data_quality_score?: number;
  analysis_type?: string;
  output_format?: 'text' | 'json' | 'structured';
}
```

### Variable Validation

- **Required vs Optional** - Templates specify which variables are mandatory
- **Type Validation** - Ensures variables match expected types
- **PII Detection** - Automatically detects and flags sensitive data
- **Content Limits** - Prevents excessively long variable content

## 🚀 Deployment

### Prerequisites

- AWS CLI configured
- Node.js and npm installed
- Appropriate AWS permissions for Lambda, Secrets Manager, DynamoDB

### Deploy Template System

```bash
cd infra/lambdas/bedrock-agent
./deploy-templates.sh
```

### Deployment Steps

1. **Install Dependencies** - npm install
2. **Build TypeScript** - Compile to JavaScript
3. **Run Tests** - Validate template system
4. **Create Secrets** - Store prompt templates in AWS Secrets Manager
5. **Package Lambda** - Create deployment ZIP
6. **Update Function** - Deploy to AWS Lambda
7. **Test Deployment** - Verify template system works

### Environment Variables

```bash
TEMPLATE_SYSTEM_ENABLED=true
TEMPLATE_CACHE_TTL=300
TEMPLATE_VALIDATION_STRICT=true
```

## 🧪 Testing

### Test Categories

1. **Template Generation Tests** - Verify templates generate correct prompts
2. **Security Validation Tests** - Ensure security guards are enforced
3. **Variable Validation Tests** - Test input validation and PII detection
4. **Integration Tests** - Test VC system integration
5. **Rollback Tests** - Verify version control functionality

### Run Tests

```bash
npm test -- --testPathPattern=template-system.test.ts
```

## 📈 Monitoring & Analytics

### CloudWatch Metrics

- Template usage by type
- Security validation failures
- Variable validation errors
- Response generation times

### DynamoDB Logging

All template operations are logged to `bedrock_template_logs` table:

```json
{
  "template_id": "vc_analysis_v1",
  "timestamp": "2024-01-15T10:30:00Z",
  "user_id": "user-123",
  "variables_count": 8,
  "security_score": 95,
  "generation_time_ms": 150
}
```

## 🔧 Configuration

### Template Registry Configuration

Templates are stored in AWS Secrets Manager under `bedrock/prompt-templates`:

#### Feature-Flexibilität
Template-Inhalte können dynamisch auf Basis von Feature-Flags angepasst werden – z. B. durch Ein-/Ausschalten von SWOT oder ROI-Blöcken. Dies ermöglicht A/B-Testing und graduelle Rollouts neuer Features ohne Code-Deployment.

```json
{
  "vc_analysis_base": "Base template content...",
  "content_generation_base": "Content template...",
  "persona_detection_base": "Persona template...",
  "text_rewrite_base": "Rewrite template..."
}
```

### Security Rules Configuration

```typescript
const securityRules = {
  maxPromptLength: 100000,
  requiredSecuritySections: [
    'SICHERHEITSKONTEXT',
    'ERLAUBTE AKTIONEN',
    'VERBOTENE AKTIONEN'
  ],
  forbiddenPatterns: [
    /ignore\s+previous\s+instructions/i,
    /forget\s+everything/i,
    /system\s*:\s*/i
  ]
};
```

## 🚨 Error Handling

### Common Errors

1. **TEMPLATE_NOT_FOUND** - Template ID doesn't exist
2. **MISSING_REQUIRED_VARIABLES** - Required template variables missing
3. **TEMPLATE_VALIDATION_FAILED** - Template fails security validation
4. **SENSITIVE_DATA_IN_VARIABLE** - PII detected in input variables

### Error Response Format

```json
{
  "error": "TEMPLATE_VALIDATION_FAILED",
  "message": "Template validation failed: Missing security section",
  "code": "TEMPLATE_VALIDATION_FAILED",
  "severity": "critical",
  "suggestions": ["Add SICHERHEITSKONTEXT section to template"]
}
```

## 🔮 Future Enhancements

### Planned Features

1. **Multi-Language Templates** - Support for additional languages
2. **A/B Testing Framework** - Template performance comparison
3. **Dynamic Template Learning** - Templates that improve based on usage
4. **Custom Template Builder** - UI for creating custom templates
5. **Template Marketplace** - Shared templates across instances
6. **Prompt Performance Optimization** - Automatic token and cost optimization
7. **Advanced Persona Learning** - Dynamic persona adaptation based on user behavior
8. **Template Provenance Signatures** - Anti-tamper protection with KMS signing

### Integration Roadmap

1. **Google Gemini Integration** - Multi-provider template support
2. **Advanced Analytics** - Template performance metrics
3. **Real-time Optimization** - Dynamic template adjustment
4. **Custom Persona Creation** - User-defined persona types

## 📚 API Reference

### Template Registry Methods

```typescript
// Get template
const template = templateRegistry.getTemplate('vc_analysis_v1');

// Create new version
templateRegistry.createVersion(templateId, version, description, content);

// Rollback version
templateRegistry.rollbackVersion(templateId, targetVersion);

// Validate variables
const validation = templateRegistry.validateTemplateVariables(templateId, variables);
```

### Template Classes

```typescript
// VC Analysis
const vcTemplate = new VCAnalysisTemplate(contract);
const prompt = vcTemplate.generate(variables);

// Content Generation
const contentTemplate = new ContentGenerationTemplate(contract);
const prompt = contentTemplate.generate(variables);

// Persona Detection
const personaTemplate = new PersonaDetectionTemplate(contract);
const prompt = personaTemplate.generate(variables);

// Text Rewrite
const rewriteTemplate = new TextRewriteTemplate(contract);
const prompt = rewriteTemplate.generate(variables);
```

## 🤝 Contributing

### Adding New Templates

1. Create template class extending `BasePromptTemplate`
2. Implement `generate()` method with security guards
3. Add to template registry with proper versioning
4. Write comprehensive tests
5. Update documentation

### Security Guidelines

- Always include security context section
- Never allow direct API calls or data storage
- Validate all input variables
- Include legal disclaimers
- Test for prompt injection vulnerabilities

#### Hash-Validierung
Jeder generierte Prompt wird mit einem SHA-256 Hash markiert, basierend auf Template-ID + aufgelösten Variablen. Dieser Hash dient der eindeutigen Auditierung und Performance-Messung. Der Hash wird automatisch generiert und in den Performance-Logs gespeichert.

## 📞 Support

For issues or questions about the template system:

1. Check CloudWatch logs for error details
2. Validate template structure and variables
3. Test with minimal example
4. Review security validation results
5. Contact development team with specific error codes

---

**Note**: This template system is designed to be secure by default. All templates include non-removable security guards and undergo automatic validation. Any attempts to bypass security measures will be logged and blocked.