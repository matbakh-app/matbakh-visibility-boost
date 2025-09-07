# Bedrock AI Core - API Documentation

## Overview

The Bedrock AI Core provides intelligent analysis and content generation capabilities for matbakh.app, leveraging AWS Bedrock with Claude 3.5 Sonnet. This system powers the Visibility Check analysis, business framework integration, and persona-adaptive responses.

## API Endpoints

### Core AI Analysis Endpoints

#### POST /ai/vc/analyze
Performs comprehensive visibility check analysis with AI-powered insights.

**Request:**
```json
{
  "lead_id": "uuid",
  "business_data": {
    "business_name": "string",
    "location": {
      "street": "string",
      "city": "string",
      "postal_code": "string",
      "country": "string"
    },
    "main_category": "string",
    "sub_categories": ["string"],
    "website_url": "string",
    "social_media": {
      "instagram_url": "string",
      "facebook_url": "string",
      "gmb_url": "string"
    },
    "benchmark_urls": ["string"]
  },
  "user_preferences": {
    "language": "de|en",
    "persona_type": "Solo-Sarah|Bewahrer-Ben|Wachstums-Walter|Ketten-Katrin",
    "analysis_depth": "quick|detailed|comprehensive"
  }
}
```

**Response:**
```json
{
  "analysis_id": "uuid",
  "status": "completed|processing|failed",
  "results": {
    "summary_score": 85,
    "swot_analysis": {
      "strengths": ["string"],
      "weaknesses": ["string"],
      "opportunities": ["string"],
      "threats": ["string"]
    },
    "business_frameworks": {
      "porters_five_forces": {
        "competitive_rivalry": 7,
        "supplier_power": 5,
        "buyer_power": 6,
        "threat_of_substitution": 4,
        "threat_of_new_entry": 5
      },
      "balanced_scorecard": {
        "financial": 8,
        "customer": 7,
        "internal_process": 6,
        "learning_growth": 7
      },
      "hofstede_dimensions": {
        "power_distance": 6,
        "individualism": 7,
        "masculinity": 5,
        "uncertainty_avoidance": 6,
        "long_term_orientation": 8,
        "indulgence": 6
      }
    },
    "recommendations": [
      {
        "category": "quick_wins|strategic|seasonal",
        "title": "string",
        "description": "string",
        "impact_score": 8,
        "effort_required": "low|medium|high",
        "estimated_roi": "string (non-binding)",
        "timeline": "string"
      }
    ],
    "content_suggestions": [
      {
        "platform": "google_mb|instagram|facebook",
        "content_type": "post|story|photo",
        "suggested_content": "string",
        "hashtags": ["string"],
        "best_posting_time": "string"
      }
    ]
  },
  "metadata": {
    "processing_time_ms": 2500,
    "token_usage": 1250,
    "cost_estimate": "0.025",
    "model_version": "claude-3-5-sonnet-20240620",
    "persona_confidence": 0.92
  }
}
```

#### GET /ai/vc/result/{analysis_id}
Retrieves analysis results by ID.

**Response:** Same as POST /ai/vc/analyze response

#### POST /ai/content/generate
Generates AI-powered content for social media and marketing.

**Request:**
```json
{
  "business_id": "uuid",
  "content_type": "social_post|google_mb_post|website_content",
  "platform": "instagram|facebook|google_mb|website",
  "context": {
    "business_strengths": ["string"],
    "target_audience": "string",
    "seasonal_context": "string",
    "brand_voice": "professional|casual|friendly|authoritative"
  },
  "requirements": {
    "max_length": 280,
    "include_hashtags": true,
    "include_cta": true,
    "language": "de|en"
  }
}
```

**Response:**
```json
{
  "content_id": "uuid",
  "generated_content": {
    "main_text": "string",
    "hashtags": ["string"],
    "call_to_action": "string",
    "alternative_versions": ["string"]
  },
  "optimization_suggestions": [
    {
      "aspect": "engagement|reach|conversion",
      "suggestion": "string",
      "impact": "low|medium|high"
    }
  ],
  "metadata": {
    "generation_time_ms": 1800,
    "token_usage": 850,
    "quality_score": 0.89
  }
}
```

### Persona Management Endpoints

#### POST /ai/persona/detect
Detects user persona based on behavior and responses.

**Request:**
```json
{
  "user_responses": [
    {
      "question": "string",
      "answer": "string",
      "response_time_ms": 5000
    }
  ],
  "behavioral_data": {
    "session_duration": 300,
    "pages_visited": 5,
    "feature_usage": ["vc_quick", "dashboard_view"]
  }
}
```

**Response:**
```json
{
  "detected_persona": "Solo-Sarah|Bewahrer-Ben|Wachstums-Walter|Ketten-Katrin",
  "confidence_score": 0.87,
  "persona_characteristics": {
    "primary_motivations": ["string"],
    "communication_style": "simple|detailed|technical|visual",
    "decision_making_speed": "fast|moderate|deliberate",
    "risk_tolerance": "low|medium|high"
  },
  "recommended_approach": {
    "content_complexity": "basic|intermediate|advanced",
    "preferred_formats": ["text|visual|video|interactive"],
    "optimal_session_length": "short|medium|long"
  }
}
```

#### PUT /ai/persona/override/{user_id}
Admin endpoint to override user persona for testing.

**Request:**
```json
{
  "persona_type": "Solo-Sarah|Bewahrer-Ben|Wachstums-Walter|Ketten-Katrin",
  "override_reason": "testing|support|correction",
  "expires_at": "2024-12-31T23:59:59Z"
}
```

### Template Management Endpoints

#### GET /ai/templates
Lists available prompt templates.

**Response:**
```json
{
  "templates": [
    {
      "template_id": "uuid",
      "name": "vc_analysis_comprehensive",
      "version": "1.2.0",
      "persona_type": "all|specific",
      "use_case": "visibility_check|content_generation|persona_detection",
      "last_updated": "2024-01-15T10:30:00Z",
      "performance_metrics": {
        "success_rate": 0.94,
        "avg_response_time_ms": 2200,
        "user_satisfaction": 4.2
      }
    }
  ]
}
```

#### POST /ai/templates/{template_id}/validate
Validates prompt template security and structure.

**Response:**
```json
{
  "validation_result": "passed|failed|warning",
  "security_checks": {
    "prompt_injection_safe": true,
    "pii_protection_enabled": true,
    "rate_limiting_configured": true,
    "output_sanitization": true
  },
  "issues": [
    {
      "severity": "error|warning|info",
      "message": "string",
      "suggestion": "string"
    }
  ]
}
```

## Authentication & Authorization

### API Key Authentication
All API requests require authentication via API key in the header:
```
Authorization: Bearer <api_key>
X-API-Version: 1.0
```

### Role-Based Access Control
- **User**: Access to own analysis results and content generation
- **Admin**: Access to all user data and template management
- **Super Admin**: Full system access including persona overrides and system configuration

## Rate Limiting

### Standard Limits
- **Analysis Endpoints**: 10 requests per minute per user
- **Content Generation**: 20 requests per minute per user
- **Template Management**: 100 requests per minute per admin

### Cost-Based Throttling
- Automatic throttling when token usage exceeds thresholds
- Emergency shutdown at 90% of monthly budget
- Graceful degradation to cached responses

## Error Handling

### Standard Error Response
```json
{
  "error": {
    "code": "INVALID_REQUEST|RATE_LIMITED|INTERNAL_ERROR|COST_LIMIT_EXCEEDED",
    "message": "Human-readable error description",
    "details": {
      "field": "specific field that caused error",
      "suggestion": "How to fix the error"
    },
    "request_id": "uuid",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

### Error Codes
- `400` - Invalid request format or parameters
- `401` - Authentication required or invalid
- `403` - Insufficient permissions
- `429` - Rate limit exceeded
- `500` - Internal server error
- `503` - Service temporarily unavailable (cost limits or maintenance)

## Monitoring & Observability

### Health Check Endpoint
```
GET /ai/health
```

**Response:**
```json
{
  "status": "healthy|degraded|unhealthy",
  "services": {
    "bedrock": "operational|degraded|down",
    "database": "operational|degraded|down",
    "cache": "operational|degraded|down"
  },
  "metrics": {
    "avg_response_time_ms": 2100,
    "success_rate": 0.97,
    "active_requests": 15
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Metrics Endpoints
- `GET /ai/metrics/usage` - Token usage and cost metrics
- `GET /ai/metrics/performance` - Response times and success rates
- `GET /ai/metrics/personas` - Persona detection accuracy and distribution

## SDK Examples

### JavaScript/TypeScript
```typescript
import { BedrockAIClient } from '@matbakh/bedrock-ai-sdk';

const client = new BedrockAIClient({
  apiKey: process.env.BEDROCK_API_KEY,
  baseUrl: 'https://api.matbakh.app'
});

// Perform VC analysis
const analysis = await client.analyzeVisibility({
  lead_id: 'uuid',
  business_data: {
    business_name: 'Restaurant Example',
    location: {
      city: 'Munich',
      country: 'Germany'
    }
  }
});

console.log(analysis.results.summary_score);
```

### Python
```python
from matbakh_ai import BedrockAIClient

client = BedrockAIClient(
    api_key=os.getenv('BEDROCK_API_KEY'),
    base_url='https://api.matbakh.app'
)

# Generate content
content = client.generate_content(
    business_id='uuid',
    content_type='social_post',
    platform='instagram'
)

print(content.generated_content.main_text)
```

## Webhook Integration

### Event Types
- `analysis.completed` - VC analysis finished
- `content.generated` - Content generation completed
- `persona.detected` - New persona detection
- `cost.threshold_reached` - Cost limit warning

### Webhook Payload
```json
{
  "event_type": "analysis.completed",
  "event_id": "uuid",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "analysis_id": "uuid",
    "lead_id": "uuid",
    "status": "completed",
    "summary_score": 85
  }
}
```

## Security Considerations

### Data Protection
- All PII is automatically detected and redacted from logs
- Analysis results are encrypted at rest
- API communications use TLS 1.3
- Regular security audits and penetration testing

### Prompt Security
- Built-in prompt injection protection
- Template validation prevents malicious prompts
- Output sanitization removes sensitive information
- Rate limiting prevents abuse

### Compliance
- GDPR compliant data handling
- Audit trails for all AI operations
- Data retention policies enforced
- User consent tracking integrated

## Support & Troubleshooting

### Common Issues
1. **High Response Times**: Check system status and consider caching
2. **Rate Limiting**: Implement exponential backoff in client code
3. **Cost Overruns**: Monitor usage and implement client-side throttling
4. **Persona Detection Accuracy**: Provide more behavioral data points

### Support Channels
- Technical Documentation: https://docs.matbakh.app/ai
- API Status Page: https://status.matbakh.app
- Developer Support: ai-support@matbakh.app
- Emergency Contact: +49-xxx-xxx-xxxx (24/7 for production issues)