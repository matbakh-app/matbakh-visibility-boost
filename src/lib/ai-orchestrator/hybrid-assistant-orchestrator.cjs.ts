/**
 * 🌉 Brücken-Datei für Jest 29+ Kompatibilität
 *
 * Diese Datei ist ein temporärer Kompatibilitäts-Adapter zwischen:
 * - ESM-nativer Implementierung (hybrid-assistant-orchestrator.ts)
 * - CommonJS-basiertem Jest Test Runner
 *
 * 🗑️ KANN GELÖSCHT WERDEN nach Teil 2 (ESM-Native Migration)
 */

// Re-export the class directly to avoid import issues in tests
export {
  HybridAssistantOrchestrator,
  hybridAssistant,
} from "./hybrid-assistant-orchestrator";

// Import types only to avoid runtime issues
import type {
  BedrockAdvice,
  HybridWorkflowResult,
  KiroImplementationPlan,
  TaskRequest,
} from "./hybrid-assistant-orchestrator";

// 👇 Sauberer CommonJS-Export für Jest mit lazy loading
module.exports = {
  // Use dynamic import to avoid circular dependency issues
  get HybridAssistantOrchestrator() {
    return require("./hybrid-assistant-orchestrator")
      .HybridAssistantOrchestrator;
  },
  get hybridAssistant() {
    return require("./hybrid-assistant-orchestrator").hybridAssistant;
  },
  // Re-export types as placeholders for CJS compatibility
  TaskRequest: {} as TaskRequest,
  BedrockAdvice: {} as BedrockAdvice,
  KiroImplementationPlan: {} as KiroImplementationPlan,
  HybridWorkflowResult: {} as HybridWorkflowResult,
  // Default export for maximum compatibility
  get default() {
    return require("./hybrid-assistant-orchestrator")
      .HybridAssistantOrchestrator;
  },
};
