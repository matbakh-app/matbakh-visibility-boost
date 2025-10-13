# LLM Usage Policy & Guidelines

## 🎯 Purpose

This document defines the mandatory policies and guidelines for all Large Language Model (LLM) interactions within the matbakh.app platform. It ensures compliance with provider agreements, data protection regulations, and security best practices.

## 🔐 Core Principles

### 1. No Training on Customer Data

**MANDATORY:** All LLM interactions must explicitly prevent the use of customer data for model training.

### 2. Data Minimization

**MANDATORY:** Only send necessary data to LLM providers. Remove or anonymize PII before processing.

### 3. Compliance First

**MANDATORY:** Every LLM request must pass compliance checks before execution.

### 4. Audit Everything

**MANDATORY:** All LLM interactions must be logged with full audit trail.

## 📋 Provider-Specific Implementation

### AWS Bedrock

```typescript
// ✅ CORRECT: Bedrock request with no-training compliance
const bedrockRequest = {
  modelId: "anthropic.claude-3-sonnet-20240229-v1:0",
  contentType: "application/json",
  accept: "application/json",
  body: JSON.stringify({
    anthropic_version: "bedrock-2023-05-31",
    messages: messages,
    max_tokens: 2048,
    // 🚨 MANDATORY: No training metadata
    metadata: {
      no_training: true,
      data_processing_purpose: "inference_only",
      compliance_mode: "strict",
    },
  }),
};
```

### Google AI Platform

```typescript
// ✅ CORRECT: Google AI request with no-training compliance
const googleRequest = {
  model: "gemini-pro",
  contents: contents,
  generationConfig: {
    temperature: 0.7,
    maxOutputTokens: 2048,
    // 🚨 MANDATORY: No training configuration
    customAttributes: {
      no_training: true,
      data_retention: "inference_only",
      compliance_mode: "gdpr_strict",
    },
  },
  safetySettings: [
    {
      category: "HARM_CATEGORY_DATA_USAGE",
      threshold: "BLOCK_NONE",
    },
  ],
};
```

### Meta AI (Llama)

```typescript
// ✅ CORRECT: Meta AI request with no-training compliance
const metaRequest = {
  model: "llama-2-70b-chat",
  messages: messages,
  // 🚨 MANDATORY: No training headers
  headers: {
    "X-No-Training": "true",
    "X-Data-Usage": "inference-only",
    "X-Retention-Policy": "no-storage",
    "X-Compliance-Mode": "strict",
  },
  parameters: {
    temperature: 0.7,
    max_tokens: 2048,
    // 🚨 MANDATORY: No training parameter
    no_training: true,
  },
};
```

## 🛡️ Mandatory Compliance Checks

### Pre-Request Validation

```typescript
import { complianceIntegration } from "@/lib/ai-orchestrator/compliance-integration";

async function makeLLMRequest(request: AiRequest, provider: Provider) {
  // 🚨 MANDATORY: Compliance check before every LLM request
  const complianceResult = await complianceIntegration.performComplianceCheck(
    request,
    provider,
    requestId
  );

  if (!complianceResult.allowed) {
    throw new Error(
      `LLM request blocked: ${complianceResult.violations.join(", ")}`
    );
  }

  // 🚨 MANDATORY: Enforce compliance
  await complianceIntegration.enforceCompliance(request, provider, requestId);

  // Execute request only after compliance validation
  const response = await executeLLMRequest(request, provider);

  // 🚨 MANDATORY: Wrap response with compliance metadata
  return await complianceIntegration.wrapResponseWithCompliance(
    response,
    complianceResult
  );
}
```

### Post-Request Audit

```typescript
// 🚨 MANDATORY: Log all LLM interactions
await auditTrailSystem.logRequestComplete(requestId, response, {
  provider,
  complianceStatus: "compliant",
  noTrainingVerified: true,
  dataClassification: "confidential",
});
```

## 🚫 Prohibited Practices

### ❌ NEVER: Direct Provider Calls

```typescript
// ❌ FORBIDDEN: Direct calls without compliance checks
const response = await fetch("https://api.openai.com/v1/chat/completions", {
  method: "POST",
  headers: { Authorization: `Bearer ${apiKey}` },
  body: JSON.stringify(request),
}); // VIOLATION: No compliance check!
```

### ❌ NEVER: Ignore Compliance Errors

```typescript
// ❌ FORBIDDEN: Ignoring compliance violations
try {
  await complianceIntegration.enforceCompliance(request, provider, requestId);
} catch (complianceError) {
  console.log("Ignoring compliance error"); // VIOLATION!
  // Proceeding anyway - FORBIDDEN!
}
```

### ❌ NEVER: Skip No-Training Parameters

```typescript
// ❌ FORBIDDEN: Missing no-training parameters
const request = {
  model: "gpt-4",
  messages: messages,
  temperature: 0.7,
  // VIOLATION: Missing no_training: true
};
```

## ✅ Required Practices

### ✅ ALWAYS: Use Compliance Integration

```typescript
// ✅ CORRECT: Always use compliance integration
import { complianceIntegration } from "@/lib/ai-orchestrator/compliance-integration";

const response = await complianceIntegration.executeWithCompliance(
  request,
  provider,
  requestId
);
```

### ✅ ALWAYS: Include No-Training Parameters

```typescript
// ✅ CORRECT: Always include no-training parameters
const requestWithCompliance = {
  ...baseRequest,
  metadata: { no_training: true }, // AWS Bedrock
  customAttributes: { no_training: true }, // Google AI
  headers: { "X-No-Training": "true" }, // Meta AI
};
```

### ✅ ALWAYS: Validate Provider Agreements

```typescript
// ✅ CORRECT: Validate provider agreements
const agreement = await providerAgreementCompliance.verifyProviderCompliance(
  provider
);
if (!agreement.compliant) {
  throw new Error(
    `Provider ${provider} not compliant: ${agreement.violations.join(", ")}`
  );
}
```

## 📊 Use Case Guidelines

### RAG (Retrieval-Augmented Generation)

```typescript
// ✅ CORRECT: RAG with compliance
async function performRAG(query: string, context: string[]) {
  // Anonymize context before sending to LLM
  const anonymizedContext = await anonymizeData(context);

  const request = {
    prompt: `Context: ${anonymizedContext.join("\n")}\nQuery: ${query}`,
    context: {
      domain: "rag",
      intent: "information_retrieval",
      dataClassification: "internal",
    },
  };

  return await complianceIntegration.executeWithCompliance(
    request,
    "bedrock", // Preferred for RAG
    generateRequestId()
  );
}
```

### Content Generation

```typescript
// ✅ CORRECT: Content generation with compliance
async function generateContent(prompt: string, persona: string) {
  const request = {
    prompt: `Generate content for ${persona}: ${prompt}`,
    context: {
      domain: "content_generation",
      intent: "marketing",
      dataClassification: "public",
    },
  };

  return await complianceIntegration.executeWithCompliance(
    request,
    "google", // Preferred for content generation
    generateRequestId()
  );
}
```

### Data Analysis

```typescript
// ✅ CORRECT: Data analysis with compliance
async function analyzeData(data: any[], analysisType: string) {
  // Remove PII before analysis
  const sanitizedData = await removePII(data);

  const request = {
    prompt: `Analyze this data: ${JSON.stringify(sanitizedData)}`,
    context: {
      domain: "data_analysis",
      intent: "business_intelligence",
      dataClassification: "confidential",
    },
  };

  return await complianceIntegration.executeWithCompliance(
    request,
    "bedrock", // Preferred for data analysis
    generateRequestId()
  );
}
```

## 🔍 Testing Requirements

### Unit Tests

```typescript
describe("LLM Usage Compliance", () => {
  it("should include no-training parameters", async () => {
    const mockProvider = jest.fn();
    await makeLLMRequest(testRequest, "bedrock");

    expect(mockProvider).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          no_training: true,
        }),
      })
    );
  });

  it("should block non-compliant requests", async () => {
    const nonCompliantRequest = createNonCompliantRequest();

    await expect(
      makeLLMRequest(nonCompliantRequest, "unknown_provider")
    ).rejects.toThrow("LLM request blocked");
  });
});
```

### Integration Tests

```typescript
describe("LLM Provider Integration", () => {
  it("should enforce compliance for all providers", async () => {
    const providers = ["bedrock", "google", "meta"];

    for (const provider of providers) {
      const request = createTestRequest();
      const response = await makeLLMRequest(request, provider);

      expect(response.metadata.compliance.checked).toBe(true);
      expect(response.metadata.compliance.score).toBeGreaterThan(90);
    }
  });
});
```

## 📈 Monitoring & Metrics

### Compliance Metrics

- **Compliance Rate:** >99% of all LLM requests must be compliant
- **Violation Rate:** <1% of all LLM requests should trigger violations
- **Response Time:** Compliance checks should add <100ms overhead
- **Agreement Coverage:** 100% of providers must have valid agreements

### Monitoring Dashboard

- **Real-time Compliance Status:** Live monitoring of all LLM interactions
- **Provider Health:** Status of all provider agreements and compliance
- **Violation Alerts:** Immediate alerts for compliance violations
- **Usage Analytics:** Detailed analytics on LLM usage patterns

## 🚨 Incident Response

### Compliance Violations

1. **Immediate Block:** Non-compliant requests are automatically blocked
2. **Alert Generation:** Immediate alert to security team
3. **Investigation:** Root cause analysis within 24 hours
4. **Remediation:** Fix implementation within 48 hours
5. **Documentation:** Complete incident documentation

### Provider Agreement Issues

1. **Provider Suspension:** Immediate suspension of non-compliant providers
2. **Legal Review:** Legal team review of agreement violations
3. **Remediation Plan:** Development of remediation plan with provider
4. **Re-verification:** Complete re-verification before re-enabling

## 📚 Reference Documentation

### Internal Documentation

- **[Provider Agreement Compliance](provider-agreement-compliance.md):** Complete compliance documentation
- **[Security & Privacy](security-and-privacy.md):** Overall security framework
- **[AI Orchestrator Documentation](../src/lib/ai-orchestrator/README.md):** Technical implementation details

### External References

- **[AWS Bedrock Data Privacy](https://docs.aws.amazon.com/bedrock/latest/userguide/data-protection.html)**
- **[Google AI Platform Privacy](https://cloud.google.com/ai-platform/docs/privacy)**
- **[Meta AI Privacy Policy](https://ai.meta.com/privacy-policy/)**

## 🎯 Compliance Checklist

### Before Every LLM Request

- [ ] Compliance check performed
- [ ] Provider agreement verified
- [ ] No-training parameters included
- [ ] Data anonymized/sanitized
- [ ] Audit logging enabled

### After Every LLM Request

- [ ] Response compliance verified
- [ ] Audit trail completed
- [ ] Metrics updated
- [ ] Error handling verified

### Regular Reviews

- [ ] Monthly compliance reports generated
- [ ] Quarterly provider agreement reviews
- [ ] Annual policy updates
- [ ] Continuous monitoring active

---

## ⚠️ CRITICAL REMINDER

**This policy is MANDATORY for ALL LLM interactions in the matbakh.app platform.**

Violations can result in:

- **Regulatory Fines:** GDPR fines up to 4% of annual revenue
- **Contract Violations:** Breach of provider agreements
- **Data Privacy Incidents:** Customer data exposure
- **Reputational Damage:** Loss of customer trust

**When in doubt:** Always choose the most restrictive approach and consult the compliance team.

### 🔗 Related Documentation

This policy is enforced through the [Provider Agreement Compliance](provider-agreement-compliance.md) system, which provides:

- Technical implementation of compliance checks
- Real-time monitoring and violation detection
- Comprehensive audit trails and reporting
- Automated enforcement mechanisms

---

**Last Updated:** 2025-01-14  
**Next Review:** 2025-04-14  
**Document Owner:** AI Compliance Team
