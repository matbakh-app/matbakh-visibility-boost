export type Provider = 'bedrock' | 'google' | 'meta';

export interface Capability {
    contextTokens: number;
    supportsTools: boolean;
    supportsJson: boolean;
    supportsVision?: boolean;
    costPer1kInput: number;  // € per 1k prompt tokens
    costPer1kOutput: number; // € per 1k completion tokens
    defaultLatencyMs: number; // typical p50
}

export interface ModelSpec {
    provider: Provider;
    modelId: string; // e.g., bedrock: "anthropic.claude-3-5-sonnet", google: "gemini-1.5-pro", meta: "llama-3-70b"
    capability: Capability;
}

export interface ToolSpec {
    name: string;
    description?: string;
    // JSON Schema for args (provider-agnostic)
    parameters?: Record<string, any>;
}

export interface RouterInputContext {
    userId?: string;
    tenant?: string;
    locale?: string; // e.g. 'de-DE'
    domain?: 'general' | 'culinary' | 'support' | 'legal' | 'medical';
    pii?: boolean; // if input may contain PII
    slaMs?: number; // latency objective
    budgetTier?: 'low' | 'standard' | 'premium';
    requireTools?: boolean;
    maxCostEuro?: number; // per request ceiling
}

export interface RouteDecision {
    provider: Provider;
    modelId: string;
    temperature: number;
    tools?: ToolSpec[];
    reason: string; // auditability
}

export interface ProviderResponse {
    text?: string;
    toolCalls?: Array<{ name: string; arguments: any }>;
    raw: any;
    tokensUsed?: {
        input: number;
        output: number;
    };
    latencyMs?: number;
}

export interface AiRequest {
    prompt: string;
    context: RouterInputContext;
    tools?: ToolSpec[];
    streaming?: boolean;
}

export interface AiResponse {
    provider: Provider;
    modelId: string;
    text?: string;
    toolCalls?: Array<{ name: string; arguments: any }>;
    latencyMs: number;
    costEuro: number;
    success: boolean;
    error?: string;
    requestId: string;
}