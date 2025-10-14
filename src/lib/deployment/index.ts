/**
 * Deployment System - One-click deployment with blue-green strategy and monitoring
 */

export { DeploymentMonitor, deploymentMonitor } from './deployment-monitor';
export { DeploymentOrchestrator, deploymentOrchestrator } from './deployment-orchestrator';
export { EnvironmentManager, environmentManager } from './environment-manager';

export type { ArtifactManifest, DeploymentConfig, DeploymentMetrics, DeploymentStatus, GateResult, HealthCheckResult } from './deployment-orchestrator';

export type {
    AlertConfig,
    DeploymentAlert,
    MonitoringMetrics
} from './deployment-monitor';

export type {
    Environment, EnvironmentChange, EnvironmentConfig, PromotionApproval, PromotionPlan
} from './environment-manager';
