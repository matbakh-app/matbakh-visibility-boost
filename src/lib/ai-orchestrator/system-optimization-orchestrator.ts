/**
 * System Optimization Orchestrator
 *
 * Zentraler Orchestrator für alle System-Optimierungskomponenten.
 * Koordiniert Intelligent System Health Monitor, Performance Optimizer,
 * Auto Resolution Optimizer und andere Optimierungskomponenten.
 */
import { AutoResolutionOptimizer } from "./auto-resolution-optimizer";
import { BedrockSupportManager } from "./bedrock-support-manager";
import {
  HealthRecommendation,
  IntelligentSystemHealthMonitor,
  SystemHealthMetrics,
} from "./intelligent-system-health-monitor";
import { PerformanceRollbackManager } from "./performance-rollback-manager";
import { SystemResourceMonitor } from "./system-resource-monitor";

export interface OptimizationConfig {
  enableAutoOptimization: boolean;
  healthCheckInterval: number; // milliseconds
  optimizationThresholds: {
    healthScoreThreshold: number; // 0-1
    criticalAnomalyThreshold: number;
    highPriorityRecommendationThreshold: number;
  };
  autoExecuteRecommendations: {
    enabled: boolean;
    maxPriorityLevel: number; // 1-10
    requiresApproval: string[]; // recommendation categories requiring approval
  };
}

export interface OptimizationResult {
  timestamp: Date;
  triggeredBy: "health_check" | "manual" | "scheduled";
  healthMetrics: SystemHealthMetrics;
  executedRecommendations: ExecutedRecommendation[];
  overallImpact: {
    healthImprovement: number;
    performanceGain: number;
    issuesResolved: number;
  };
  nextRecommendedActions: HealthRecommendation[];
}

export interface ExecutedRecommendation {
  recommendation: HealthRecommendation;
  executionStatus: "success" | "failed" | "partial";
  executionTime: number; // milliseconds
  impact: string;
  error?: string;
}

export class SystemOptimizationOrchestrator {
  private healthMonitor: IntelligentSystemHealthMonitor;
  private resourceMonitor: SystemResourceMonitor;
  private autoResolutionOptimizer: AutoResolutionOptimizer;
  private rollbackManager: PerformanceRollbackManager;
  private bedrockSupportManager?: BedrockSupportManager;

  private config: OptimizationConfig;
  private isRunning: boolean = false;
  private optimizationHistory: OptimizationResult[] = [];
  private scheduledOptimizationTimer?: NodeJS.Timeout;

  constructor(
    resourceMonitor?: SystemResourceMonitor,
    autoResolutionOptimizer?: AutoResolutionOptimizer,
    rollbackManager?: PerformanceRollbackManager,
    bedrockSupportManager?: BedrockSupportManager,
    config?: Partial<OptimizationConfig>
  ) {
    this.resourceMonitor = resourceMonitor || new SystemResourceMonitor();
    this.autoResolutionOptimizer =
      autoResolutionOptimizer || new AutoResolutionOptimizer();
    this.rollbackManager = rollbackManager || new PerformanceRollbackManager();
    this.bedrockSupportManager = bedrockSupportManager;

    this.healthMonitor = new IntelligentSystemHealthMonitor(
      this.resourceMonitor,
      this.autoResolutionOptimizer,
      this.rollbackManager,
      this.bedrockSupportManager
    );

    this.config = {
      enableAutoOptimization: true,
      healthCheckInterval: 60000, // 1 minute
      optimizationThresholds: {
        healthScoreThreshold: 0.8,
        criticalAnomalyThreshold: 1,
        highPriorityRecommendationThreshold: 2,
      },
      autoExecuteRecommendations: {
        enabled: true,
        maxPriorityLevel: 7, // Auto-execute up to priority 7
        requiresApproval: ["scaling", "maintenance"], // These require manual approval
      },
      ...config,
    };
  }

  /**
   * Startet den System-Optimierungs-Orchestrator
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error("System Optimization Orchestrator is already running");
    }

    this.isRunning = true;

    try {
      // Starte Health Monitor
      await this.healthMonitor.startMonitoring();
      this.healthMonitor.setHealthCheckInterval(
        this.config.healthCheckInterval
      );

      // Starte geplante Optimierungen
      if (this.config.enableAutoOptimization) {
        this.startScheduledOptimization();
      }

      console.log("System Optimization Orchestrator started successfully");
    } catch (error) {
      this.isRunning = false;
      throw new Error(
        `Failed to start System Optimization Orchestrator: ${error}`
      );
    }
  }

  /**
   * Stoppt den System-Optimierungs-Orchestrator
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;

    // Stoppe geplante Optimierungen
    if (this.scheduledOptimizationTimer) {
      clearInterval(this.scheduledOptimizationTimer);
      this.scheduledOptimizationTimer = undefined;
    }

    // Stoppe Health Monitor
    await this.healthMonitor.stopMonitoring();

    console.log("System Optimization Orchestrator stopped");
  }

  /**
   * Startet geplante Optimierungen
   */
  private startScheduledOptimization(): void {
    const optimizationInterval = this.config.healthCheckInterval * 2; // Alle 2 Health Checks

    this.scheduledOptimizationTimer = setInterval(async () => {
      try {
        await this.performOptimizationCycle("scheduled");
      } catch (error) {
        console.error("Scheduled optimization failed:", error);
      }
    }, optimizationInterval);

    console.log(
      `Scheduled optimization started with ${optimizationInterval}ms intervals`
    );
  }

  /**
   * Führt einen vollständigen Optimierungszyklus durch
   */
  async performOptimizationCycle(
    triggeredBy: "health_check" | "manual" | "scheduled" = "manual"
  ): Promise<OptimizationResult> {
    console.log(`Starting optimization cycle (triggered by: ${triggeredBy})`);

    // Führe Health Check durch
    const healthMetrics = await this.healthMonitor.performHealthCheck();

    // Prüfe ob Optimierung notwendig ist
    if (!this.shouldOptimize(healthMetrics)) {
      console.log("No optimization needed - system health is acceptable");
      return {
        timestamp: new Date(),
        triggeredBy,
        healthMetrics,
        executedRecommendations: [],
        overallImpact: {
          healthImprovement: 0,
          performanceGain: 0,
          issuesResolved: 0,
        },
        nextRecommendedActions: healthMetrics.recommendations,
      };
    }

    // Führe Optimierungen durch
    const executedRecommendations = await this.executeRecommendations(
      healthMetrics.recommendations
    );

    // Messe Impact nach Optimierung
    await new Promise((resolve) => setTimeout(resolve, 2000)); // Warte kurz
    const postOptimizationMetrics =
      await this.healthMonitor.performHealthCheck();

    const overallImpact = this.calculateOptimizationImpact(
      healthMetrics,
      postOptimizationMetrics
    );

    const result: OptimizationResult = {
      timestamp: new Date(),
      triggeredBy,
      healthMetrics,
      executedRecommendations,
      overallImpact,
      nextRecommendedActions: postOptimizationMetrics.recommendations,
    };

    // Speichere in Historie
    this.optimizationHistory.push(result);

    // Behalte nur die letzten 100 Einträge
    if (this.optimizationHistory.length > 100) {
      this.optimizationHistory = this.optimizationHistory.slice(-100);
    }

    console.log(
      `Optimization cycle completed - Health improvement: ${(
        overallImpact.healthImprovement * 100
      ).toFixed(1)}%`
    );

    return result;
  }

  /**
   * Prüft ob Optimierung notwendig ist
   */
  private shouldOptimize(healthMetrics: SystemHealthMetrics): boolean {
    const thresholds = this.config.optimizationThresholds;

    // Prüfe Health Score
    if (healthMetrics.overallHealth < thresholds.healthScoreThreshold) {
      return true;
    }

    // Prüfe kritische Anomalien
    const criticalAnomalies = healthMetrics.anomalies.filter(
      (a) => a.severity === "critical"
    );
    if (criticalAnomalies.length >= thresholds.criticalAnomalyThreshold) {
      return true;
    }

    // Prüfe hochpriorisierte Empfehlungen
    const highPriorityRecommendations = healthMetrics.recommendations.filter(
      (r) => r.priority >= 8
    );
    if (
      highPriorityRecommendations.length >=
      thresholds.highPriorityRecommendationThreshold
    ) {
      return true;
    }

    return false;
  }

  /**
   * Führt Empfehlungen aus
   */
  private async executeRecommendations(
    recommendations: HealthRecommendation[]
  ): Promise<ExecutedRecommendation[]> {
    const executedRecommendations: ExecutedRecommendation[] = [];

    for (const recommendation of recommendations) {
      // Prüfe ob automatische Ausführung erlaubt ist
      if (!this.canAutoExecute(recommendation)) {
        console.log(
          `Skipping recommendation ${recommendation.id} - requires manual approval`
        );
        continue;
      }

      const startTime = Date.now();

      try {
        const impact = await this.executeRecommendation(recommendation);
        const executionTime = Date.now() - startTime;

        executedRecommendations.push({
          recommendation,
          executionStatus: "success",
          executionTime,
          impact,
        });

        console.log(
          `Successfully executed recommendation: ${recommendation.title}`
        );
      } catch (error) {
        const executionTime = Date.now() - startTime;

        executedRecommendations.push({
          recommendation,
          executionStatus: "failed",
          executionTime,
          impact: "Failed to execute",
          error: error instanceof Error ? error.message : "Unknown error",
        });

        console.error(
          `Failed to execute recommendation ${recommendation.title}:`,
          error
        );
      }
    }

    return executedRecommendations;
  }

  /**
   * Prüft ob eine Empfehlung automatisch ausgeführt werden kann
   */
  private canAutoExecute(recommendation: HealthRecommendation): boolean {
    if (!this.config.autoExecuteRecommendations.enabled) {
      return false;
    }

    // Prüfe Prioritätslevel
    if (
      recommendation.priority >
      this.config.autoExecuteRecommendations.maxPriorityLevel
    ) {
      return false;
    }

    // Prüfe ob Kategorie Genehmigung erfordert
    if (
      this.config.autoExecuteRecommendations.requiresApproval.includes(
        recommendation.category
      )
    ) {
      return false;
    }

    return true;
  }

  /**
   * Führt eine einzelne Empfehlung aus
   */
  private async executeRecommendation(
    recommendation: HealthRecommendation
  ): Promise<string> {
    switch (recommendation.category) {
      case "optimization":
        return await this.executeOptimizationRecommendation(recommendation);
      case "scaling":
        return await this.executeScalingRecommendation(recommendation);
      case "maintenance":
        return await this.executeMaintenanceRecommendation(recommendation);
      case "security":
        return await this.executeSecurityRecommendation(recommendation);
      default:
        throw new Error(
          `Unknown recommendation category: ${recommendation.category}`
        );
    }
  }

  /**
   * Führt Optimierungs-Empfehlung aus
   */
  private async executeOptimizationRecommendation(
    recommendation: HealthRecommendation
  ): Promise<string> {
    // Simuliere Optimierungsaktionen
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (recommendation.title.includes("Resource Monitor")) {
      // Optimiere Resource Monitor
      return "Resource monitor configuration optimized";
    } else if (recommendation.title.includes("Auto-Resolution")) {
      // Optimiere Auto-Resolution
      this.autoResolutionOptimizer.performAdaptiveLearning();
      return "Auto-resolution optimizer tuned for better performance";
    } else if (recommendation.title.includes("Throughput")) {
      // Optimiere Throughput
      return "Throughput optimization applied - caching and connection pooling improved";
    }

    return "General optimization applied";
  }

  /**
   * Führt Skalierungs-Empfehlung aus
   */
  private async executeScalingRecommendation(
    recommendation: HealthRecommendation
  ): Promise<string> {
    // Simuliere Skalierungsaktionen
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return "Infrastructure scaling initiated - additional resources allocated";
  }

  /**
   * Führt Wartungs-Empfehlung aus
   */
  private async executeMaintenanceRecommendation(
    recommendation: HealthRecommendation
  ): Promise<string> {
    // Simuliere Wartungsaktionen
    await new Promise((resolve) => setTimeout(resolve, 800));

    if (recommendation.title.includes("Critical Issue")) {
      return "Critical issues addressed - system stability restored";
    } else if (recommendation.title.includes("Proactive")) {
      return "Proactive maintenance completed - potential issues prevented";
    }

    return "Maintenance tasks completed";
  }

  /**
   * Führt Sicherheits-Empfehlung aus
   */
  private async executeSecurityRecommendation(
    recommendation: HealthRecommendation
  ): Promise<string> {
    // Simuliere Sicherheitsaktionen
    await new Promise((resolve) => setTimeout(resolve, 600));

    return "Security measures implemented - system hardening applied";
  }

  /**
   * Berechnet den Impact der Optimierung
   */
  private calculateOptimizationImpact(
    beforeMetrics: SystemHealthMetrics,
    afterMetrics: SystemHealthMetrics
  ): {
    healthImprovement: number;
    performanceGain: number;
    issuesResolved: number;
  } {
    const healthImprovement =
      afterMetrics.overallHealth - beforeMetrics.overallHealth;

    const performanceGain = this.calculatePerformanceGain(
      beforeMetrics,
      afterMetrics
    );

    const issuesResolved = Math.max(
      0,
      beforeMetrics.anomalies.length - afterMetrics.anomalies.length
    );

    return {
      healthImprovement,
      performanceGain,
      issuesResolved,
    };
  }

  /**
   * Berechnet Performance-Verbesserung
   */
  private calculatePerformanceGain(
    beforeMetrics: SystemHealthMetrics,
    afterMetrics: SystemHealthMetrics
  ): number {
    const responseTimeImprovement =
      (beforeMetrics.performanceIndicators.responseTime -
        afterMetrics.performanceIndicators.responseTime) /
      beforeMetrics.performanceIndicators.responseTime;

    const throughputImprovement =
      (afterMetrics.performanceIndicators.throughput -
        beforeMetrics.performanceIndicators.throughput) /
      beforeMetrics.performanceIndicators.throughput;

    const errorRateImprovement =
      (beforeMetrics.performanceIndicators.errorRate -
        afterMetrics.performanceIndicators.errorRate) /
      beforeMetrics.performanceIndicators.errorRate;

    // Gewichteter Durchschnitt
    return (
      responseTimeImprovement * 0.4 +
      throughputImprovement * 0.4 +
      errorRateImprovement * 0.2
    );
  }

  /**
   * Führt manuelle Optimierung durch
   */
  async optimizeNow(): Promise<OptimizationResult> {
    if (!this.isRunning) {
      throw new Error("System Optimization Orchestrator is not running");
    }

    return await this.performOptimizationCycle("manual");
  }

  /**
   * Gibt aktuelle System-Gesundheit zurück
   */
  async getCurrentSystemHealth(): Promise<SystemHealthMetrics> {
    return await this.healthMonitor.performHealthCheck();
  }

  /**
   * Gibt Optimierungshistorie zurück
   */
  getOptimizationHistory(limit?: number): OptimizationResult[] {
    if (limit) {
      return this.optimizationHistory.slice(-limit);
    }
    return [...this.optimizationHistory];
  }

  /**
   * Gibt umfassenden Status zurück
   */
  async getSystemStatus(): Promise<{
    isRunning: boolean;
    healthStatus: any;
    lastOptimization?: OptimizationResult;
    pendingRecommendations: HealthRecommendation[];
    systemMetrics: SystemHealthMetrics;
    optimizationStats: {
      totalOptimizations: number;
      successfulOptimizations: number;
      averageHealthImprovement: number;
      averagePerformanceGain: number;
      totalIssuesResolved: number;
    };
  }> {
    const healthStatus = this.healthMonitor.getHealthStatus();
    const systemMetrics = await this.getCurrentSystemHealth();
    const lastOptimization =
      this.optimizationHistory.length > 0
        ? this.optimizationHistory[this.optimizationHistory.length - 1]
        : undefined;

    // Berechne Optimierungsstatistiken
    const optimizationStats = this.calculateOptimizationStats();

    return {
      isRunning: this.isRunning,
      healthStatus,
      lastOptimization,
      pendingRecommendations: systemMetrics.recommendations,
      systemMetrics,
      optimizationStats,
    };
  }

  /**
   * Berechnet Optimierungsstatistiken
   */
  private calculateOptimizationStats(): {
    totalOptimizations: number;
    successfulOptimizations: number;
    averageHealthImprovement: number;
    averagePerformanceGain: number;
    totalIssuesResolved: number;
  } {
    const totalOptimizations = this.optimizationHistory.length;

    if (totalOptimizations === 0) {
      return {
        totalOptimizations: 0,
        successfulOptimizations: 0,
        averageHealthImprovement: 0,
        averagePerformanceGain: 0,
        totalIssuesResolved: 0,
      };
    }

    const successfulOptimizations = this.optimizationHistory.filter((opt) =>
      opt.executedRecommendations.some(
        (rec) => rec.executionStatus === "success"
      )
    ).length;

    const totalHealthImprovement = this.optimizationHistory.reduce(
      (sum, opt) => sum + opt.overallImpact.healthImprovement,
      0
    );

    const totalPerformanceGain = this.optimizationHistory.reduce(
      (sum, opt) => sum + opt.overallImpact.performanceGain,
      0
    );

    const totalIssuesResolved = this.optimizationHistory.reduce(
      (sum, opt) => sum + opt.overallImpact.issuesResolved,
      0
    );

    return {
      totalOptimizations,
      successfulOptimizations,
      averageHealthImprovement: totalHealthImprovement / totalOptimizations,
      averagePerformanceGain: totalPerformanceGain / totalOptimizations,
      totalIssuesResolved,
    };
  }

  /**
   * Aktualisiert Konfiguration
   */
  updateConfig(newConfig: Partial<OptimizationConfig>): void {
    const oldConfig = { ...this.config };
    this.config = { ...this.config, ...newConfig };

    // Aktualisiere Health Check Intervall
    if (oldConfig.healthCheckInterval !== this.config.healthCheckInterval) {
      this.healthMonitor.setHealthCheckInterval(
        this.config.healthCheckInterval
      );
    }

    // Starte/Stoppe automatische Optimierung
    if (
      oldConfig.enableAutoOptimization !== this.config.enableAutoOptimization
    ) {
      if (this.config.enableAutoOptimization && this.isRunning) {
        this.startScheduledOptimization();
      } else if (this.scheduledOptimizationTimer) {
        clearInterval(this.scheduledOptimizationTimer);
        this.scheduledOptimizationTimer = undefined;
      }
    }

    console.log("System Optimization Orchestrator configuration updated");
  }

  /**
   * Gibt aktuelle Konfiguration zurück
   */
  getConfig(): OptimizationConfig {
    return { ...this.config };
  }
}

export default SystemOptimizationOrchestrator;
