// Core Types
export * from "./types";

// Router and Policy Engine
export { AiRouterGateway } from "./ai-router-gateway";
export { RouterPolicyEngine } from "./router-policy-engine";

// Adapters
export { BedrockAdapter } from "./adapters/bedrock-adapter";
export { GoogleAdapter } from "./adapters/google-adapter";
export { MetaAdapter } from "./adapters/meta-adapter";
export { BaseAdapter, ToolCallAdapter } from "./adapters/tool-call-adapter";

// Bandit and Experimentation
export { BanditLogger, ThompsonBandit } from "./bandit-controller";
export type {
  Arm,
  ArmStats,
  BanditContext,
  BanditLoggerOpts,
} from "./bandit-controller";

// Gateway Server
export { bandit, app as gatewayApp, logger, router } from "./gateway-server";

// Performance and Monitoring
export * from "./caching-layer";
export * from "./circuit-breaker";
export * from "./performance-monitor";
export * from "./win-rate-tracker";

// Basic Monitoring and Logging
export * from "./basic-logger";
export * from "./basic-monitor";

// Integration and Deployment
export * from "./ai-feature-flags";
export * from "./cost-performance-optimizer";
export * from "./dark-deployment-manager";
export * from "./monitoring-analytics";
export * from "./multi-provider-integration";
export * from "./production-deployment";

// Safety and Security
export * from "./safety/guardrails-service";

// Audit Trail and Compliance
export * from "./audit-integration";
export * from "./audit-trail-system";

// Default model configurations
export const DEFAULT_MODELS = [
  {
    provider: "bedrock" as const,
    modelId: "anthropic.claude-3-5-sonnet-20241022-v2:0",
    capability: {
      contextTokens: 200000,
      supportsTools: true,
      supportsJson: true,
      supportsVision: true,
      defaultLatencyMs: 600,
      costPer1kInput: 0.003,
      costPer1kOutput: 0.015,
    },
  },
  {
    provider: "google" as const,
    modelId: "gemini-1.5-pro",
    capability: {
      contextTokens: 1000000,
      supportsTools: true,
      supportsJson: true,
      supportsVision: true,
      defaultLatencyMs: 700,
      costPer1kInput: 0.002,
      costPer1kOutput: 0.01,
    },
  },
  {
    provider: "meta" as const,
    modelId: "llama-3-70b",
    capability: {
      contextTokens: 32768,
      supportsTools: false,
      supportsJson: false,
      supportsVision: false,
      defaultLatencyMs: 800,
      costPer1kInput: 0.001,
      costPer1kOutput: 0.006,
    },
  },
];

// Utility functions
export const createAiOrchestrator = (options?: {
  models?: typeof DEFAULT_MODELS;
  defaultTemperature?: number;
  enableCaching?: boolean;
  enableMetrics?: boolean;
}) => {
  return new AiRouterGateway({
    models: options?.models || DEFAULT_MODELS,
    defaultTemperature: options?.defaultTemperature || 0.2,
    enableCaching: options?.enableCaching ?? true,
    enableMetrics: options?.enableMetrics ?? true,
  });
};

export const createBanditController = (evidentlyProject?: string) => {
  const bandit = new ThompsonBandit();
  const logger = new BanditLogger({
    project:
      evidentlyProject ||
      process.env.EVIDENTLY_PROJECT ||
      "matbakh-ai-development",
  });

  return { bandit, logger };
};

// Basic monitoring utilities
import { BasicLogger } from "./basic-logger";
import { BasicMonitor } from "./basic-monitor";

export const createBasicMonitor = (serviceName?: string) => {
  const logger = new BasicLogger(serviceName || "ai-orchestrator");
  const monitor = new BasicMonitor(logger);

  return { logger, monitor };
};
