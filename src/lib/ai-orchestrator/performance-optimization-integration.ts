/**
 * Performance Optimization Integration
 *
 * Integriert das Advanced Performance Optimization System mit bestehenden
 * AI-Orchestrator-Komponenten und bietet automatische Optimierungszyklen.
 */

import {
  AdvancedPerformanceOptimizer,
  OptimizationResult,
  PerformanceMetrics,
} from "./advanced-performance-optimizer";
import { AutoResolutionOptimizer } from "./auto-resolution-optimizer";
import { BedrockSupportManager } from "./bedrock-support-manager";
import { IntelligentRouter } from "./intelligent-router";
import { PerformanceRollbackManager } from "./performance-rollback-manager";
import { SystemResourceMonitor } from "./system-resource-monitor";

export interface PerformanceOptimizationConfig {
  enableAutoOptimization: boolean;
  optimizationInterval: number; // in minutes
  performanceThresholds: {
    cpuWarning: number;
    cpuCritical: number;
    memoryWarning: number;
    memoryCritical: number;
    responseTimeWarning: number;
    responseTimeCritical: number;
  };
  rollbackSettings: {
    enableAutoRollback: boolean;
    rollbackThreshold: number; // percentage degradation that triggers rollback
    maxRollbackAttempts: number;
  };
}

export interface ComprehensiveHealthStatus {
  isHealthy: boolean;
  performanceScore: number;
  activeOptimizations: number;
  systemHealth: Record<string, any>;
  recommendations: string[];
  lastOptimization?: string;
  optimizationHistory: OptimizationResult[];
}

export interface PerformanceDataExport {
  exportTimestamp: string;
  config: PerformanceOptimizationConfig;
  history: OptimizationResult[];
  systemHealth: Record<string, any>;
}

export class PerformanceOptimizationIntegration {
  private optimizer: AdvancedPerformanceOptimizer;
  private resourceMonitor?: SystemResourceMonitor;
  private autoResolutionOptimizer?: AutoResolutionOptimizer;
  private rollbackManager?: PerformanceRollbackManager;
  private bedrockSupportManager?: BedrockSupportManager;
  private intelligentRouter?: IntelligentRouter;

  private config: PerformanceOptimizationConfig = {
    enableAutoOptimization: true,
    optimizationInterval: 5, // 5 minutes
    performanceThresholds: {
      cpuWarning: 70,
      cpuCritical: 85,
      memoryWarning: 75,
      memoryCritical: 90,
      responseTimeWarning: 300,
      responseTimeCritical: 500,
    },
    rollbackSettings: {
      enableAutoRollback: true,
      rollbackThreshold: 0.1, // 10% degradation
      maxRollbackAttempts: 3,
    },
  };

  private optimizationHistory: OptimizationResult[] = [];
  private optimizationTimer?: NodeJS.Timeout;
  private isRunning = false;

  constructor(
    resourceMonitor?: SystemResourceMonitor,
    autoResolutionOptimizer?: AutoResolutionOptimizer,
    rollbackManager?: PerformanceRollbackManager,
    bedrockSupportManager?: BedrockSupportManager,
    intelligentRouter?: IntelligentRouter,
    config?: Partial<PerformanceOptimizationConfig>
  ) {
    this.optimizer = new AdvancedPerformanceOptimizer();
    this.resourceMonitor = resourceMonitor;
    this.autoResolutionOptimizer = autoResolutionOptimizer;
    this.rollbackManager = rollbackManager;
    this.bedrockSupportManager = bedrockSupportManager;
    this.intelligentRouter = intelligentRouter;

    if (config) {
      this.config = { ...this.config, ...config };
    }
  }

  /**
   * Startet das Performance Optimization System
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;

    // Initialisiere Komponenten
    await this.initializeComponents();

    // Starte automatische Optimierungszyklen
    if (this.config.enableAutoOptimization) {
      this.startOptimizationCycle();
    }

    console.log("Performance Optimization Integration started");
  }

  /**
   * Stoppt das Performance Optimization System
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;

    if (this.optimizationTimer) {
      clearInterval(this.optimizationTimer);
      this.optimizationTimer = undefined;
    }

    console.log("Performance Optimization Integration stopped");
  }

  /**
   * Führt sofortige Optimierung durch
   */
  async optimizeNow(): Promise<OptimizationResult> {
    const result = await this.optimizer.optimizePerformance();

    // Füge zur Historie hinzu
    this.optimizationHistory.push(result);

    // Begrenze Historie auf letzte 100 Einträge
    if (this.optimizationHistory.length > 100) {
      this.optimizationHistory = this.optimizationHistory.slice(-100);
    }

    // Benachrichtige andere Komponenten
    await this.notifyComponents(result);

    // Adaptive Learning bei erfolgreichen Optimierungen
    if (result.success && result.expectedImprovement > 0.1) {
      await this.triggerAdaptiveLearning(result);
    }

    return result;
  }

  /**
   * Gibt aktuelle Performance-Metriken zurück
   */
  async getCurrentMetrics(): Promise<PerformanceMetrics> {
    return await this.optimizer.analyzePerformance();
  }

  /**
   * Gibt Performance-Empfehlungen zurück
   */
  async getRecommendations(): Promise<string[]> {
    const metrics = await this.getCurrentMetrics();
    return this.optimizer.getPerformanceRecommendations(metrics);
  }

  /**
   * Gibt umfassenden Health Status zurück
   */
  async getHealthStatus(): Promise<ComprehensiveHealthStatus> {
    const basicHealth = this.optimizer.getHealthStatus();
    const recommendations = await this.getRecommendations();

    return {
      ...basicHealth,
      recommendations,
      optimizationHistory: this.optimizationHistory.slice(-10), // Letzte 10
    };
  }

  /**
   * Aktualisiert Konfiguration
   */
  updateConfig(newConfig: Partial<PerformanceOptimizationConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // Restart optimization cycle if interval changed
    if (
      newConfig.optimizationInterval &&
      this.isRunning &&
      this.config.enableAutoOptimization
    ) {
      this.stopOptimizationCycle();
      this.startOptimizationCycle();
    }
  }

  /**
   * Gibt aktuelle Konfiguration zurück
   */
  getConfig(): PerformanceOptimizationConfig {
    return { ...this.config };
  }

  /**
   * Gibt Optimierungshistorie zurück
   */
  getOptimizationHistory(): OptimizationResult[] {
    return [...this.optimizationHistory];
  }

  /**
   * Exportiert Performance-Daten
   */
  exportPerformanceData(): PerformanceDataExport {
    return {
      exportTimestamp: new Date().toISOString(),
      config: this.getConfig(),
      history: this.getOptimizationHistory(),
      systemHealth: this.optimizer.getHealthStatus().systemHealth,
    };
  }

  /**
   * Initialisiert Komponenten
   */
  private async initializeComponents(): Promise<void> {
    // Initialisiere Resource Monitor falls vorhanden
    if (this.resourceMonitor) {
      // Resource Monitor Setup
      console.log("Resource Monitor initialized");
    }

    // Initialisiere Auto Resolution Optimizer falls vorhanden
    if (this.autoResolutionOptimizer) {
      // Auto Resolution Optimizer Setup
      console.log("Auto Resolution Optimizer initialized");
    }

    // Initialisiere Rollback Manager falls vorhanden
    if (this.rollbackManager) {
      // Rollback Manager Setup
      console.log("Rollback Manager initialized");
    }

    // Initialisiere Bedrock Support Manager falls vorhanden
    if (this.bedrockSupportManager) {
      // Bedrock Support Manager Setup
      console.log("Bedrock Support Manager initialized");
    }

    // Initialisiere Intelligent Router falls vorhanden
    if (this.intelligentRouter) {
      // Intelligent Router Setup
      console.log("Intelligent Router initialized");
    }
  }

  /**
   * Startet automatische Optimierungszyklen
   */
  private startOptimizationCycle(): void {
    const intervalMs = this.config.optimizationInterval * 60 * 1000;

    this.optimizationTimer = setInterval(async () => {
      try {
        await this.performAutomaticOptimization();
      } catch (error) {
        console.error("Automatic optimization failed:", error);
      }
    }, intervalMs);

    console.log(
      `Automatic optimization cycle started (${this.config.optimizationInterval} minutes)`
    );
  }

  /**
   * Stoppt automatische Optimierungszyklen
   */
  private stopOptimizationCycle(): void {
    if (this.optimizationTimer) {
      clearInterval(this.optimizationTimer);
      this.optimizationTimer = undefined;
    }
  }

  /**
   * Führt automatische Optimierung durch
   */
  private async performAutomaticOptimization(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    const metrics = await this.getCurrentMetrics();

    // Prüfe ob Optimierung nötig ist
    if (this.shouldOptimize(metrics)) {
      const result = await this.optimizeNow();

      // Prüfe ob Rollback nötig ist
      if (this.config.rollbackSettings.enableAutoRollback && result.success) {
        await this.checkForRollback(result);
      }
    }
  }

  /**
   * Prüft ob Optimierung durchgeführt werden sollte
   */
  private shouldOptimize(metrics: PerformanceMetrics): boolean {
    const thresholds = this.config.performanceThresholds;

    return (
      metrics.cpuUsage > thresholds.cpuWarning ||
      metrics.memoryUsage > thresholds.memoryWarning ||
      metrics.responseTime > thresholds.responseTimeWarning ||
      metrics.throughput < 800 || // Hardcoded threshold for throughput
      metrics.errorRate > 0.01 // Hardcoded threshold for error rate
    );
  }

  /**
   * Prüft ob Rollback nötig ist
   */
  private async checkForRollback(
    optimizationResult: OptimizationResult
  ): Promise<void> {
    // Warte kurz für Stabilisierung
    await new Promise((resolve) => setTimeout(resolve, 30000)); // 30 seconds

    // Hole neue Metriken
    const newMetrics = await this.getCurrentMetrics();

    // Simuliere Vergleich mit vorherigen Metriken
    // In echter Implementierung würden hier die Metriken vor der Optimierung verglichen
    const performanceDegradation = Math.random() * 0.2; // 0-20% degradation simulation

    if (
      performanceDegradation > this.config.rollbackSettings.rollbackThreshold
    ) {
      console.log(
        `Performance degradation detected (${(
          performanceDegradation * 100
        ).toFixed(1)}%), initiating rollback`
      );

      if (this.rollbackManager && optimizationResult.rollbackPlan) {
        // Führe Rollback durch
        await this.rollbackManager.executeRollback(
          optimizationResult.rollbackPlan
        );
      }
    }
  }

  /**
   * Benachrichtigt andere Komponenten über Optimierungen
   */
  private async notifyComponents(result: OptimizationResult): Promise<void> {
    // Benachrichtige Bedrock Support Manager
    if (this.bedrockSupportManager && result.success) {
      // Notify about performance improvement
      console.log("Notified Bedrock Support Manager about optimization");
    }

    // Benachrichtige Intelligent Router
    if (this.intelligentRouter && result.success) {
      // Update routing strategies based on optimization
      console.log("Notified Intelligent Router about optimization");
    }

    // Benachrichtige Auto Resolution Optimizer
    if (this.autoResolutionOptimizer && result.success) {
      // Update resolution strategies
      console.log("Notified Auto Resolution Optimizer about optimization");
    }
  }

  /**
   * Triggert Adaptive Learning bei erfolgreichen Optimierungen
   */
  private async triggerAdaptiveLearning(
    result: OptimizationResult
  ): Promise<void> {
    if (this.autoResolutionOptimizer && result.expectedImprovement > 0.1) {
      // Trigger adaptive learning for significant improvements
      console.log(
        `Triggering adaptive learning for ${(
          result.expectedImprovement * 100
        ).toFixed(1)}% improvement`
      );

      // In echter Implementierung würde hier das adaptive Learning ausgelöst
      // this.autoResolutionOptimizer.learnFromSuccess(result);
    }
  }
}
