/**
 * Intelligent System Health Monitor
 *
 * Erweiterte System-Gesundheitsüberwachung mit intelligenter Anomalieerkennung
 * und proaktiven Optimierungsempfehlungen für das AI-Orchestrator System.
 */
import { AutoResolutionOptimizer } from "./auto-resolution-optimizer";
import { BedrockSupportManager } from "./bedrock-support-manager";
import { PerformanceRollbackManager } from "./performance-rollback-manager";
import { SystemResourceMonitor } from "./system-resource-monitor";

export interface SystemHealthMetrics {
  timestamp: Date;
  overallHealth: number; // 0-1 score
  componentHealth: {
    resourceMonitor: number;
    autoResolution: number;
    rollbackManager: number;
    bedrockSupport: number;
  };
  performanceIndicators: {
    responseTime: number;
    throughput: number;
    errorRate: number;
    resourceUtilization: number;
  };
  anomalies: HealthAnomaly[];
  recommendations: HealthRecommendation[];
}

export interface HealthAnomaly {
  id: string;
  type: "performance" | "resource" | "error" | "availability";
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  detectedAt: Date;
  affectedComponents: string[];
  potentialImpact: string;
  suggestedActions: string[];
}

export interface HealthRecommendation {
  id: string;
  category: "optimization" | "scaling" | "maintenance" | "security";
  priority: number; // 1-10
  title: string;
  description: string;
  expectedBenefit: string;
  implementationEffort: "low" | "medium" | "high";
  estimatedTimeToImplement: string;
  prerequisites: string[];
}

export interface HealthTrend {
  metric: string;
  direction: "improving" | "stable" | "degrading";
  changeRate: number;
  confidence: number;
  timeWindow: string;
}

export class IntelligentSystemHealthMonitor {
  private resourceMonitor: SystemResourceMonitor;
  private autoResolutionOptimizer: AutoResolutionOptimizer;
  private rollbackManager: PerformanceRollbackManager;
  private bedrockSupportManager?: BedrockSupportManager;

  private healthHistory: SystemHealthMetrics[] = [];
  private anomalyDetectionThresholds: Map<string, number> = new Map();
  private isMonitoring: boolean = false;
  private monitoringInterval?: NodeJS.Timeout;
  private healthCheckInterval: number = 30000; // 30 seconds

  constructor(
    resourceMonitor?: SystemResourceMonitor,
    autoResolutionOptimizer?: AutoResolutionOptimizer,
    rollbackManager?: PerformanceRollbackManager,
    bedrockSupportManager?: BedrockSupportManager
  ) {
    this.resourceMonitor = resourceMonitor || new SystemResourceMonitor();
    this.autoResolutionOptimizer =
      autoResolutionOptimizer || new AutoResolutionOptimizer();
    this.rollbackManager = rollbackManager || new PerformanceRollbackManager();
    this.bedrockSupportManager = bedrockSupportManager;

    this.initializeAnomalyThresholds();
  }

  /**
   * Initialisiert Anomalie-Erkennungsschwellenwerte
   */
  private initializeAnomalyThresholds(): void {
    this.anomalyDetectionThresholds.set("cpu_usage_high", 85);
    this.anomalyDetectionThresholds.set("memory_usage_high", 90);
    this.anomalyDetectionThresholds.set("error_rate_high", 0.05);
    this.anomalyDetectionThresholds.set("response_time_high", 2000);
    this.anomalyDetectionThresholds.set("throughput_low", 100);
    this.anomalyDetectionThresholds.set("success_rate_low", 0.95);
  }

  /**
   * Startet kontinuierliche Gesundheitsüberwachung
   */
  async startMonitoring(): Promise<void> {
    if (this.isMonitoring) {
      throw new Error("Health monitoring is already running");
    }

    this.isMonitoring = true;

    try {
      // Starte Resource Monitoring
      await this.resourceMonitor.startMonitoring();

      // Starte periodische Gesundheitschecks
      this.monitoringInterval = setInterval(async () => {
        try {
          await this.performHealthCheck();
        } catch (error) {
          console.error("Health check failed:", error);
        }
      }, this.healthCheckInterval);

      console.log("Intelligent System Health Monitor started successfully");
    } catch (error) {
      this.isMonitoring = false;
      throw new Error(`Failed to start health monitoring: ${error}`);
    }
  }

  /**
   * Stoppt kontinuierliche Gesundheitsüberwachung
   */
  async stopMonitoring(): Promise<void> {
    if (!this.isMonitoring) {
      return;
    }

    this.isMonitoring = false;

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }

    await this.resourceMonitor.stopMonitoring();

    console.log("Intelligent System Health Monitor stopped");
  }

  /**
   * Führt eine umfassende Gesundheitsprüfung durch
   */
  async performHealthCheck(): Promise<SystemHealthMetrics> {
    const timestamp = new Date();

    // Sammle Metriken von allen Komponenten
    const resourceMetrics = await this.resourceMonitor.getResourceMetrics();
    const autoResolutionMetrics =
      this.autoResolutionOptimizer.getSuccessRateMetrics();
    const rollbackHealth = this.rollbackManager.getHealthStatus();
    const bedrockHealth = this.bedrockSupportManager?.getHealthStatus();

    // Berechne Komponenten-Gesundheit
    const componentHealth = {
      resourceMonitor: this.calculateResourceHealth(resourceMetrics),
      autoResolution: autoResolutionMetrics.currentSuccessRate,
      rollbackManager: rollbackHealth.isHealthy ? 1.0 : 0.5,
      bedrockSupport: bedrockHealth?.isHealthy ? 1.0 : 0.8, // Default wenn nicht verfügbar
    };

    // Berechne Performance-Indikatoren
    const performanceIndicators = {
      responseTime: this.calculateResponseTime(),
      throughput: this.calculateThroughput(),
      errorRate: 1 - autoResolutionMetrics.currentSuccessRate,
      resourceUtilization:
        (resourceMetrics.cpu.usage + resourceMetrics.memory.usage) / 200,
    };

    // Erkenne Anomalien
    const anomalies = this.detectAnomalies(
      resourceMetrics,
      performanceIndicators
    );

    // Generiere Empfehlungen
    const recommendations = this.generateRecommendations(
      componentHealth,
      performanceIndicators,
      anomalies
    );

    // Berechne Gesamtgesundheit
    const overallHealth = this.calculateOverallHealth(
      componentHealth,
      performanceIndicators
    );

    const healthMetrics: SystemHealthMetrics = {
      timestamp,
      overallHealth,
      componentHealth,
      performanceIndicators,
      anomalies,
      recommendations,
    };

    // Speichere in Historie
    this.healthHistory.push(healthMetrics);

    // Behalte nur die letzten 1000 Einträge
    if (this.healthHistory.length > 1000) {
      this.healthHistory = this.healthHistory.slice(-1000);
    }

    return healthMetrics;
  }

  /**
   * Berechnet Ressourcen-Gesundheit
   */
  private calculateResourceHealth(resourceMetrics: any): number {
    const cpuScore = Math.max(0, 1 - resourceMetrics.cpu.usage / 100);
    const memoryScore = Math.max(0, 1 - resourceMetrics.memory.usage / 100);
    const diskScore = Math.max(0, 1 - resourceMetrics.disk.usage / 100);

    return (cpuScore + memoryScore + diskScore) / 3;
  }

  /**
   * Berechnet Response Time (simuliert)
   */
  private calculateResponseTime(): number {
    // Simuliere Response Time basierend auf aktueller Last
    const baseResponseTime = 200;
    const variance = Math.random() * 300;
    return baseResponseTime + variance;
  }

  /**
   * Berechnet Throughput (simuliert)
   */
  private calculateThroughput(): number {
    // Simuliere Throughput basierend auf aktueller Kapazität
    const baseThroughput = 500;
    const variance = Math.random() * 200;
    return baseThroughput + variance;
  }

  /**
   * Berechnet Gesamtgesundheit
   */
  private calculateOverallHealth(
    componentHealth: any,
    performanceIndicators: any
  ): number {
    const componentScore =
      (componentHealth.resourceMonitor +
        componentHealth.autoResolution +
        componentHealth.rollbackManager +
        componentHealth.bedrockSupport) /
      4;

    const performanceScore =
      Math.max(0, 1 - performanceIndicators.errorRate) *
      Math.max(0, 1 - performanceIndicators.resourceUtilization) *
      Math.min(1, performanceIndicators.throughput / 500);

    return componentScore * 0.6 + performanceScore * 0.4;
  }

  /**
   * Erkennt Anomalien im System
   */
  private detectAnomalies(
    resourceMetrics: any,
    performanceIndicators: any
  ): HealthAnomaly[] {
    const anomalies: HealthAnomaly[] = [];

    // CPU-Anomalien
    if (
      resourceMetrics.cpu.usage >
      this.anomalyDetectionThresholds.get("cpu_usage_high")!
    ) {
      anomalies.push({
        id: `cpu-high-${Date.now()}`,
        type: "resource",
        severity: resourceMetrics.cpu.usage > 95 ? "critical" : "high",
        description: `High CPU usage detected: ${resourceMetrics.cpu.usage.toFixed(
          1
        )}%`,
        detectedAt: new Date(),
        affectedComponents: ["resourceMonitor", "autoResolution"],
        potentialImpact:
          "Increased response times and potential service degradation",
        suggestedActions: [
          "Scale up compute resources",
          "Optimize CPU-intensive operations",
          "Enable auto-scaling policies",
        ],
      });
    }

    // Memory-Anomalien
    if (
      resourceMetrics.memory.usage >
      this.anomalyDetectionThresholds.get("memory_usage_high")!
    ) {
      anomalies.push({
        id: `memory-high-${Date.now()}`,
        type: "resource",
        severity: resourceMetrics.memory.usage > 95 ? "critical" : "high",
        description: `High memory usage detected: ${resourceMetrics.memory.usage.toFixed(
          1
        )}%`,
        detectedAt: new Date(),
        affectedComponents: ["resourceMonitor", "rollbackManager"],
        potentialImpact: "Memory exhaustion and potential system crashes",
        suggestedActions: [
          "Increase available memory",
          "Optimize memory usage patterns",
          "Implement memory leak detection",
        ],
      });
    }

    // Error Rate-Anomalien
    if (
      performanceIndicators.errorRate >
      this.anomalyDetectionThresholds.get("error_rate_high")!
    ) {
      anomalies.push({
        id: `error-rate-high-${Date.now()}`,
        type: "error",
        severity: performanceIndicators.errorRate > 0.1 ? "critical" : "high",
        description: `High error rate detected: ${(
          performanceIndicators.errorRate * 100
        ).toFixed(1)}%`,
        detectedAt: new Date(),
        affectedComponents: ["autoResolution", "bedrockSupport"],
        potentialImpact:
          "Reduced system reliability and user experience degradation",
        suggestedActions: [
          "Investigate error sources",
          "Implement additional error handling",
          "Review and update fallback mechanisms",
        ],
      });
    }

    // Response Time-Anomalien
    if (
      performanceIndicators.responseTime >
      this.anomalyDetectionThresholds.get("response_time_high")!
    ) {
      anomalies.push({
        id: `response-time-high-${Date.now()}`,
        type: "performance",
        severity:
          performanceIndicators.responseTime > 5000 ? "critical" : "medium",
        description: `High response time detected: ${performanceIndicators.responseTime.toFixed(
          0
        )}ms`,
        detectedAt: new Date(),
        affectedComponents: ["resourceMonitor", "autoResolution"],
        potentialImpact: "Poor user experience and potential timeouts",
        suggestedActions: [
          "Optimize slow operations",
          "Implement caching strategies",
          "Scale up infrastructure",
        ],
      });
    }

    return anomalies;
  }

  /**
   * Generiert intelligente Empfehlungen
   */
  private generateRecommendations(
    componentHealth: any,
    performanceIndicators: any,
    anomalies: HealthAnomaly[]
  ): HealthRecommendation[] {
    const recommendations: HealthRecommendation[] = [];

    // Empfehlungen basierend auf Komponenten-Gesundheit
    if (componentHealth.resourceMonitor < 0.8) {
      recommendations.push({
        id: `resource-optimization-${Date.now()}`,
        category: "optimization",
        priority: 8,
        title: "Resource Monitor Optimization",
        description: "Resource monitor health is below optimal levels",
        expectedBenefit: "Improved system stability and resource utilization",
        implementationEffort: "medium",
        estimatedTimeToImplement: "2-4 hours",
        prerequisites: [
          "System maintenance window",
          "Resource monitoring tools",
        ],
      });
    }

    if (componentHealth.autoResolution < 0.9) {
      recommendations.push({
        id: `auto-resolution-tuning-${Date.now()}`,
        category: "optimization",
        priority: 7,
        title: "Auto-Resolution Optimizer Tuning",
        description: "Auto-resolution success rate could be improved",
        expectedBenefit: "Higher success rate and better system reliability",
        implementationEffort: "low",
        estimatedTimeToImplement: "1-2 hours",
        prerequisites: ["Performance metrics analysis", "Configuration access"],
      });
    }

    // Empfehlungen basierend auf Performance-Indikatoren
    if (performanceIndicators.resourceUtilization > 0.8) {
      recommendations.push({
        id: `scaling-recommendation-${Date.now()}`,
        category: "scaling",
        priority: 9,
        title: "Infrastructure Scaling",
        description: "High resource utilization indicates need for scaling",
        expectedBenefit: "Reduced resource contention and improved performance",
        implementationEffort: "medium",
        estimatedTimeToImplement: "1-3 hours",
        prerequisites: ["Auto-scaling policies", "Budget approval"],
      });
    }

    if (performanceIndicators.throughput < 300) {
      recommendations.push({
        id: `throughput-optimization-${Date.now()}`,
        category: "optimization",
        priority: 6,
        title: "Throughput Optimization",
        description: "System throughput is below expected levels",
        expectedBenefit: "Increased system capacity and better user experience",
        implementationEffort: "high",
        estimatedTimeToImplement: "4-8 hours",
        prerequisites: ["Performance profiling", "Code optimization"],
      });
    }

    // Empfehlungen basierend auf Anomalien
    const criticalAnomalies = anomalies.filter(
      (a) => a.severity === "critical"
    );
    if (criticalAnomalies.length > 0) {
      recommendations.push({
        id: `critical-issue-resolution-${Date.now()}`,
        category: "maintenance",
        priority: 10,
        title: "Critical Issue Resolution",
        description: `${criticalAnomalies.length} critical anomalies detected requiring immediate attention`,
        expectedBenefit: "System stability and availability restoration",
        implementationEffort: "high",
        estimatedTimeToImplement: "Immediate",
        prerequisites: ["Emergency response team", "System access"],
      });
    }

    // Proaktive Wartungsempfehlungen
    if (this.healthHistory.length > 10) {
      const recentHealth = this.healthHistory.slice(-10);
      const avgHealth =
        recentHealth.reduce((sum, h) => sum + h.overallHealth, 0) /
        recentHealth.length;

      if (avgHealth < 0.8) {
        recommendations.push({
          id: `proactive-maintenance-${Date.now()}`,
          category: "maintenance",
          priority: 5,
          title: "Proactive System Maintenance",
          description: "System health has been declining over recent checks",
          expectedBenefit:
            "Prevention of potential system issues and improved stability",
          implementationEffort: "medium",
          estimatedTimeToImplement: "2-6 hours",
          prerequisites: ["Maintenance window", "System backup"],
        });
      }
    }

    return recommendations.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Analysiert Gesundheitstrends
   */
  analyzeHealthTrends(): HealthTrend[] {
    if (this.healthHistory.length < 5) {
      return [];
    }

    const trends: HealthTrend[] = [];
    const recentHistory = this.healthHistory.slice(-10);

    // Analysiere Overall Health Trend
    const healthValues = recentHistory.map((h) => h.overallHealth);
    const healthTrend = this.calculateTrend(healthValues);
    trends.push({
      metric: "Overall Health",
      direction: healthTrend.direction,
      changeRate: healthTrend.changeRate,
      confidence: healthTrend.confidence,
      timeWindow: "10 checks",
    });

    // Analysiere Response Time Trend
    const responseTimeValues = recentHistory.map(
      (h) => h.performanceIndicators.responseTime
    );
    const responseTimeTrend = this.calculateTrend(responseTimeValues);
    trends.push({
      metric: "Response Time",
      direction:
        responseTimeTrend.direction === "improving"
          ? "degrading"
          : responseTimeTrend.direction === "degrading"
          ? "improving"
          : "stable",
      changeRate: responseTimeTrend.changeRate,
      confidence: responseTimeTrend.confidence,
      timeWindow: "10 checks",
    });

    // Analysiere Error Rate Trend
    const errorRateValues = recentHistory.map(
      (h) => h.performanceIndicators.errorRate
    );
    const errorRateTrend = this.calculateTrend(errorRateValues);
    trends.push({
      metric: "Error Rate",
      direction:
        errorRateTrend.direction === "improving"
          ? "degrading"
          : errorRateTrend.direction === "degrading"
          ? "improving"
          : "stable",
      changeRate: errorRateTrend.changeRate,
      confidence: errorRateTrend.confidence,
      timeWindow: "10 checks",
    });

    return trends;
  }

  /**
   * Berechnet Trend für eine Metrik
   */
  private calculateTrend(values: number[]): {
    direction: "improving" | "stable" | "degrading";
    changeRate: number;
    confidence: number;
  } {
    if (values.length < 3) {
      return { direction: "stable", changeRate: 0, confidence: 0 };
    }

    // Berechne lineare Regression
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * values[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Berechne R²
    const yMean = sumY / n;
    const ssRes = values.reduce((sum, yi, i) => {
      const predicted = slope * i + intercept;
      return sum + Math.pow(yi - predicted, 2);
    }, 0);
    const ssTot = values.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
    const rSquared = 1 - ssRes / ssTot;

    // Bestimme Richtung
    let direction: "improving" | "stable" | "degrading";
    if (Math.abs(slope) < 0.01) {
      direction = "stable";
    } else if (slope > 0) {
      direction = "improving";
    } else {
      direction = "degrading";
    }

    return {
      direction,
      changeRate: Math.abs(slope),
      confidence: Math.max(0, rSquared),
    };
  }

  /**
   * Gibt aktuelle Gesundheitsmetriken zurück
   */
  getCurrentHealth(): SystemHealthMetrics | null {
    return this.healthHistory.length > 0
      ? this.healthHistory[this.healthHistory.length - 1]
      : null;
  }

  /**
   * Gibt Gesundheitshistorie zurück
   */
  getHealthHistory(limit?: number): SystemHealthMetrics[] {
    if (limit) {
      return this.healthHistory.slice(-limit);
    }
    return [...this.healthHistory];
  }

  /**
   * Gibt aktuelle Anomalien zurück
   */
  getCurrentAnomalies(): HealthAnomaly[] {
    const currentHealth = this.getCurrentHealth();
    return currentHealth ? currentHealth.anomalies : [];
  }

  /**
   * Gibt aktuelle Empfehlungen zurück
   */
  getCurrentRecommendations(): HealthRecommendation[] {
    const currentHealth = this.getCurrentHealth();
    return currentHealth ? currentHealth.recommendations : [];
  }

  /**
   * Aktualisiert Anomalie-Erkennungsschwellenwerte
   */
  updateAnomalyThresholds(thresholds: Map<string, number>): void {
    for (const [key, value] of thresholds) {
      this.anomalyDetectionThresholds.set(key, value);
    }
  }

  /**
   * Gibt Health Status zurück
   */
  getHealthStatus(): {
    isHealthy: boolean;
    overallHealth: number;
    isMonitoring: boolean;
    lastCheckTime: Date | null;
    criticalAnomalies: number;
    highPriorityRecommendations: number;
  } {
    const currentHealth = this.getCurrentHealth();
    const criticalAnomalies = currentHealth
      ? currentHealth.anomalies.filter((a) => a.severity === "critical").length
      : 0;
    const highPriorityRecommendations = currentHealth
      ? currentHealth.recommendations.filter((r) => r.priority >= 8).length
      : 0;

    return {
      isHealthy: currentHealth ? currentHealth.overallHealth > 0.8 : false,
      overallHealth: currentHealth ? currentHealth.overallHealth : 0,
      isMonitoring: this.isMonitoring,
      lastCheckTime: currentHealth ? currentHealth.timestamp : null,
      criticalAnomalies,
      highPriorityRecommendations,
    };
  }

  /**
   * Setzt Health Check Intervall
   */
  setHealthCheckInterval(intervalMs: number): void {
    this.healthCheckInterval = intervalMs;

    if (this.isMonitoring && this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = setInterval(async () => {
        try {
          await this.performHealthCheck();
        } catch (error) {
          console.error("Health check failed:", error);
        }
      }, this.healthCheckInterval);
    }
  }
}

export default IntelligentSystemHealthMonitor;
