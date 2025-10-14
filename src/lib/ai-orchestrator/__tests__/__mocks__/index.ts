/**
 * Mock Implementations Index
 *
 * Central export point for all mock implementations used in
 * Bedrock Support Manager tests.
 *
 * Usage:
 * ```typescript
 * import { HybridRoutingMocks, AuditTrailMocks, CommonMocks } from './__mocks__';
 *
 * // Create scenario-based mocks
 * const scenario = HybridRoutingMocks.Scenarios.normalOperations();
 *
 * // Create individual mocks
 * const auditTrail = new AuditTrailMocks.AuditTrailSystem();
 * const featureFlags = new CommonMocks.AiFeatureFlags();
 * ```
 */

// Export hybrid routing mocks
export {
  HybridRoutingMocks,
  HybridRoutingScenarios,
  MockDirectBedrockClient,
  MockHybridHealthMonitor,
  MockImplementationSupport,
  MockInfrastructureAuditor,
  MockIntelligentRouter,
  MockMCPRouter,
  MockMetaMonitor,
  MockStateManager,
  TestDataGenerators,
} from "./hybrid-routing-mocks";

// Export audit trail mocks
export {
  AuditTestDataGenerators,
  AuditTrailMocks,
  MockAuditTrailSystem,
} from "./audit-trail-mocks";

// Export common mocks
export {
  CommonMocks,
  MockAiFeatureFlags,
  MockBedrockAdapter,
  MockCircuitBreaker,
  MockComplianceIntegration,
  MockGDPRHybridComplianceValidator,
  MockKiroBridge,
} from "./common-mocks";

/**
 * Complete Mock Suite Factory
 *
 * Creates a complete set of mocks for comprehensive testing
 */
export class CompleteMockSuite {
  // Hybrid routing components
  public directBedrock: any;
  public mcpRouter: any;
  public intelligentRouter: any;
  public infrastructureAuditor: any;
  public metaMonitor: any;
  public implementationSupport: any;
  public hybridHealthMonitor: any;

  // Common dependencies
  public auditTrail: any;
  public featureFlags: any;
  public circuitBreaker: any;
  public complianceIntegration: any;
  public gdprValidator: any;
  public bedrockAdapter: any;
  public kiroBridge: any;

  // State management
  public stateManager: any;

  constructor(scenario?: string) {
    this.initializeMocks(scenario);
  }

  private initializeMocks(scenario?: string): void {
    // Import mock classes
    const {
      MockDirectBedrockClient,
      MockMCPRouter,
      MockIntelligentRouter,
      MockInfrastructureAuditor,
      MockMetaMonitor,
      MockImplementationSupport,
      MockHybridHealthMonitor,
      HybridRoutingScenarios,
      MockStateManager,
    } = require("./hybrid-routing-mocks");

    const { MockAuditTrailSystem } = require("./audit-trail-mocks");

    const {
      MockAiFeatureFlags,
      MockCircuitBreaker,
      MockComplianceIntegration,
      MockGDPRHybridComplianceValidator,
      MockBedrockAdapter,
      MockKiroBridge,
    } = require("./common-mocks");

    // Initialize based on scenario
    if (scenario) {
      const scenarioMocks = this.getScenarioMocks(
        scenario,
        HybridRoutingScenarios
      );
      Object.assign(this, scenarioMocks);

      // Initialize remaining mocks not provided by scenario
      if (!this.infrastructureAuditor) {
        this.infrastructureAuditor = new MockInfrastructureAuditor();
      }
      if (!this.metaMonitor) {
        this.metaMonitor = new MockMetaMonitor();
      }
      if (!this.implementationSupport) {
        this.implementationSupport = new MockImplementationSupport();
      }
    } else {
      // Default initialization
      this.directBedrock = new MockDirectBedrockClient();
      this.mcpRouter = new MockMCPRouter();
      this.intelligentRouter = new MockIntelligentRouter();
      this.infrastructureAuditor = new MockInfrastructureAuditor();
      this.metaMonitor = new MockMetaMonitor();
      this.implementationSupport = new MockImplementationSupport();
      this.hybridHealthMonitor = new MockHybridHealthMonitor();
    }

    // Always initialize common dependencies
    this.auditTrail = new MockAuditTrailSystem();
    this.featureFlags = new MockAiFeatureFlags();
    this.circuitBreaker = new MockCircuitBreaker();
    this.complianceIntegration = new MockComplianceIntegration();
    this.gdprValidator = new MockGDPRHybridComplianceValidator();
    this.bedrockAdapter = new MockBedrockAdapter();
    this.kiroBridge = new MockKiroBridge();
    this.stateManager = new MockStateManager();
  }

  private getScenarioMocks(
    scenario: string,
    Scenarios: any
  ): Record<string, any> {
    switch (scenario) {
      case "normal":
        const normalMocks = Scenarios.normalOperations();
        return {
          directBedrock: normalMocks.directBedrock,
          mcpRouter: normalMocks.mcpRouter,
          intelligentRouter: normalMocks.intelligentRouter,
          hybridHealthMonitor: normalMocks.healthMonitor,
        };
      case "mcp-failure":
        const mcpFailureMocks = Scenarios.mcpFailureWithFallback();
        return {
          directBedrock: mcpFailureMocks.directBedrock,
          mcpRouter: mcpFailureMocks.mcpRouter,
          intelligentRouter: mcpFailureMocks.intelligentRouter,
          hybridHealthMonitor: mcpFailureMocks.healthMonitor,
        };
      case "high-load":
        const highLoadMocks = Scenarios.highLoad();
        return {
          directBedrock: highLoadMocks.directBedrock,
          mcpRouter: highLoadMocks.mcpRouter,
          intelligentRouter: highLoadMocks.intelligentRouter,
          hybridHealthMonitor: highLoadMocks.healthMonitor,
        };
      case "emergency":
        const emergencyMocks = Scenarios.emergencyOperations();
        return {
          directBedrock: emergencyMocks.directBedrock,
          mcpRouter: emergencyMocks.mcpRouter,
          intelligentRouter: emergencyMocks.intelligentRouter,
          hybridHealthMonitor: emergencyMocks.healthMonitor,
        };
      case "recovery":
        const recoveryMocks = Scenarios.systemRecovery();
        return {
          directBedrock: recoveryMocks.directBedrock,
          mcpRouter: recoveryMocks.mcpRouter,
          intelligentRouter: recoveryMocks.intelligentRouter,
          hybridHealthMonitor: recoveryMocks.healthMonitor,
        };
      default:
        return {};
    }
  }

  /**
   * Reset all mocks to default state
   */
  resetAll(): void {
    const allMocks = [
      this.directBedrock,
      this.mcpRouter,
      this.intelligentRouter,
      this.infrastructureAuditor,
      this.metaMonitor,
      this.implementationSupport,
      this.hybridHealthMonitor,
      this.auditTrail,
      this.featureFlags,
      this.circuitBreaker,
      this.complianceIntegration,
      this.gdprValidator,
      this.bedrockAdapter,
      this.kiroBridge,
    ];

    allMocks.forEach((mock) => {
      if (mock) {
        Object.values(mock).forEach((value: any) => {
          if (value && typeof value.mockReset === "function") {
            value.mockReset();
          }
        });
      }
    });
  }

  /**
   * Clear all mock call history
   */
  clearAllCalls(): void {
    const allMocks = [
      this.directBedrock,
      this.mcpRouter,
      this.intelligentRouter,
      this.infrastructureAuditor,
      this.metaMonitor,
      this.implementationSupport,
      this.hybridHealthMonitor,
      this.auditTrail,
      this.featureFlags,
      this.circuitBreaker,
      this.complianceIntegration,
      this.gdprValidator,
      this.bedrockAdapter,
      this.kiroBridge,
    ];

    allMocks.forEach((mock) => {
      if (mock) {
        Object.values(mock).forEach((value: any) => {
          if (value && typeof value.mockClear === "function") {
            value.mockClear();
          }
        });
      }
    });
  }

  /**
   * Get all mocks as a flat object
   */
  getAllMocks(): Record<string, any> {
    return {
      directBedrock: this.directBedrock,
      mcpRouter: this.mcpRouter,
      intelligentRouter: this.intelligentRouter,
      infrastructureAuditor: this.infrastructureAuditor,
      metaMonitor: this.metaMonitor,
      implementationSupport: this.implementationSupport,
      hybridHealthMonitor: this.hybridHealthMonitor,
      auditTrail: this.auditTrail,
      featureFlags: this.featureFlags,
      circuitBreaker: this.circuitBreaker,
      complianceIntegration: this.complianceIntegration,
      gdprValidator: this.gdprValidator,
      bedrockAdapter: this.bedrockAdapter,
      kiroBridge: this.kiroBridge,
    };
  }
}

/**
 * Quick Mock Setup Utilities
 */
export class QuickMockSetup {
  /**
   * Setup mocks for normal operations scenario
   */
  static normalOperations(): CompleteMockSuite {
    return new CompleteMockSuite("normal");
  }

  /**
   * Setup mocks for MCP failure scenario
   */
  static mcpFailure(): CompleteMockSuite {
    return new CompleteMockSuite("mcp-failure");
  }

  /**
   * Setup mocks for high load scenario
   */
  static highLoad(): CompleteMockSuite {
    return new CompleteMockSuite("high-load");
  }

  /**
   * Setup mocks for emergency operations scenario
   */
  static emergency(): CompleteMockSuite {
    return new CompleteMockSuite("emergency");
  }

  /**
   * Setup mocks for system recovery scenario
   */
  static recovery(): CompleteMockSuite {
    return new CompleteMockSuite("recovery");
  }

  /**
   * Setup mocks with custom configuration
   */
  static custom(
    configurator: (suite: CompleteMockSuite) => void
  ): CompleteMockSuite {
    const suite = new CompleteMockSuite();
    configurator(suite);
    return suite;
  }
}

/**
 * Re-export for convenience
 */
import * as AuditTrailMocksModule from "./audit-trail-mocks";
import * as CommonMocksModule from "./common-mocks";
import * as HybridRoutingMocksModule from "./hybrid-routing-mocks";

/**
 * Default export for convenience
 */
export default {
  HybridRoutingMocks: HybridRoutingMocksModule.HybridRoutingMocks,
  AuditTrailMocks: AuditTrailMocksModule.AuditTrailMocks,
  CommonMocks: CommonMocksModule.CommonMocks,
  CompleteMockSuite,
  QuickMockSetup,
};
