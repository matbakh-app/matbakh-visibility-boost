# AI Orchestration PR Series - Production Implementation

**Status**: Ready for Phase 1 Implementation  
**Approach**: 10× & Autonomous with Hard Acceptance Criteria  
**Timeline**: 8 PRs über 6-8 Wochen  

## 🎯 **PR-Serie Overview**

### **Kritische Ergänzungen zur Roadmap**
- ✅ **EU-Residency Toggle**: Per Tenant/Request EU-only Provider/Regionen erzwingen
- ✅ **Globale Kill-Switches**: Pro Provider/Modell/Route via SSM Parameter
- ✅ **Unified Streaming Layer**: SSE/WebSocket/gRPC mit soft deadline + Fallback
- ✅ **Contract-Tests**: Schema-Drift-Schutz pro Adapter in CI
- ✅ **Kosten-/Quota-Enforcer**: Zentral als Middleware vor Bandit-Decision

---

## 🔴 **PR-1: Egress & Secrets (KRITISCH)**

### **Network Firewall Stack**
```typescript
// infra/cdk/network-security-stack.ts
export class NetworkSecurityStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: NetworkSecurityStackProps) {
    super(scope, id, props);

    // FQDN-basierte Allowlist für AI Provider
    const allowedDomains = [
      '*.googleapis.com',           // Google AI/Vertex
      'generativelanguage.googleapis.com', // Gemini API
      'aiplatform.googleapis.com',  // Vertex AI
      'api.anthropic.com',          // Direct Anthropic (falls benötigt)
    ];

    // Network Firewall Rule Group
    const aiProviderRuleGroup = new networkfirewall.CfnRuleGroup(this, 'AiProviderRuleGroup', {
      capacity: 200,
      ruleGroupName: `ai-provider-allowlist-${props.environment}`,
      type: 'STATEFUL',
      description: 'FQDN allowlist for AI provider endpoints',
      ruleGroup: {
        rulesSource: {
          rulesSourceList: {
            targetTypes: ['TLS_SNI', 'HTTP_HOST'],
            targets: allowedDomains,
            generatedRulesType: 'ALLOWLIST'
          }
        }
      }
    });
  }
}
```

### **DoD für PR-1**
- ✅ Nur erlaubte Ziele erreichbar - VPC Flow Logs bestätigen
- ✅ Secrets rotationsfähig - EventBridge Rule aktiv
- ✅ Latency < +5ms zum Status quo
- ✅ Network Firewall blockiert unerlaubte Domains

---

## 🔴 **PR-2: Guardrails & Safety (KRITISCH)**

### **Bedrock Guardrails Service**
```typescript
// src/lib/ai-orchestrator/safety/bedrock-guardrails-service.ts
export class BedrockGuardrailsService {
  private guardrailConfigs = {
    legal: {
      guardrailId: 'legal-domain-guardrail-v1',
      piiRedaction: true,
      toxicityThreshold: 'HIGH',
      jailbreakDetection: true
    },
    medical: {
      guardrailId: 'medical-domain-guardrail-v1', 
      piiRedaction: true,
      toxicityThreshold: 'MEDIUM',
      jailbreakDetection: true
    }
  };

  async applyGuardrails(prompt: string, domain: string): Promise<GuardrailResult> {
    const config = this.guardrailConfigs[domain] || this.guardrailConfigs.general;
    
    const result = await this.bedrockClient.send(new ApplyGuardrailCommand({
      guardrailIdentifier: config.guardrailId,
      source: 'INPUT',
      content: [{ text: { text: prompt } }]
    }));

    return {
      allowed: result.action === 'NONE',
      reason: result.action !== 'NONE' ? 'input_blocked' : undefined,
      modifiedPrompt: config.piiRedaction ? this.redactPII(prompt) : prompt
    };
  }
}
```

### **DoD für PR-2**
- ✅ Safety-Violations < 0.1% - Automated Testing
- ✅ Keine PII in Logs - Stichprobe 10k+ Requests
- ✅ Guardrails Response-Zeit < 100ms
- ✅ Fail-Safe bei Guardrail-Fehlern

---

## 🟠 **PR-3: Model Registry & Kill-Switch**

### **Model Registry Client**
```typescript
// src/lib/ai-orchestrator/registry/model-registry-client.ts
export class ModelRegistryClient {
  private cache = new Map<string, { data: ModelSpec[]; expires: number }>();
  private readonly CACHE_TTL = 60000; // 60 Sekunden

  async getActiveModels(environment: string): Promise<ModelSpec[]> {
    // SSM Parameter für aktive Models laden
    const activeModelsParam = await this.ssmClient.send(new GetParameterCommand({
      Name: `/ai/routing/${environment}/active-models`
    }));

    // DynamoDB Query für Model-Details
    // Cache für 60s
    return modelSpecs;
  }

  async checkKillSwitches(environment: string): Promise<KillSwitchStatus> {
    const killSwitchParams = await this.ssmClient.send(new GetParametersByPathCommand({
      Path: `/ai/kill-switches/${environment}/`
    }));

    return {
      globalKillSwitch: switches.global || false,
      providerKillSwitches: switches
    };
  }
}
```

### **DoD für PR-3**
- ✅ Modelle ohne Deploy austauschbar
- ✅ Kill-Switch greift < 30s
- ✅ Cache-Performance < 10ms
- ✅ Fail-Safe bei Registry-Fehlern

---

## 🎯 **Akzeptanzkriterien (Messbar)**

### **Routing & Failover**
- ≥ 3 Provider, ≥ 2 Modelle/Provider aktiv
- Failover zwischen Providern < 2s
- Kill-Switch Reaktionszeit < 30s

### **Compliance & Security**
- EU-Toggle: keine Non-EU-Calls (Flow-Logs verifiziert)
- 0 PII-Treffer in Log-Stichprobe (≥ 10k Requests)
- Safety-Violations < 0.1%
- Network Firewall blockiert unerlaubte Domains

### **Performance**
- Latency-Overhead < +5ms
- Streaming: 1. Token ≤ 300ms intra-Region
- Guardrails Response-Zeit < 100ms

---

## 🚀 **Empfohlene Reihenfolge**

1. **PR-1 & PR-2 sofort** - Security & Compliance Basis
2. **PR-3 parallel** - Model Registry vorbereiten  
3. **Automated Testing** - Akzeptanzkriterien in CI/CD
4. **Performance Benchmarks** - Baseline messen

**Ready to ship!** 🚢