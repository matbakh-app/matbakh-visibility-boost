/**
 * SLO Burn Rate Alerts System
 *
 * Implements Google SRE-style burn rate alerting to prevent alert fatigue
 * and provide early warning of SLO violations.
 *
 * Features:
 * - SLI (Service Level Indicator) as "good latency" ratio
 * - Dual-window burn rate alerts (5min/1h)
 * - Configurable burn rate thresholds
 * - Anti-flapping mechanisms
 */

export interface SLOTarget {
  name: string;
  route: "generation" | "rag" | "cached";
  provider?: string;
  intent?: string;
  latencyThresholdMs: number;
  sloTarget: number; // e.g., 0.95 for 95% good requests
  errorBudget: number; // e.g., 0.05 for 5% error budget
}

export interface SLIMetric {
  timestamp: number;
  route: string;
  provider: string;
  intent: string;
  latency: number;
  isGood: boolean; // latency <= threshold
}

export interface BurnRateAlert {
  id: string;
  slo: SLOTarget;
  burnRate: number;
  severity: "warning" | "critical";
  shortWindow: {
    duration: number;
    goodRatio: number;
    threshold: number;
  };
  longWindow: {
    duration: number;
    goodRatio: number;
    threshold: number;
  };
  timestamp: number;
  resolved: boolean;
}

export interface BurnRateConfig {
  // Critical: 5min/1h windows
  critical: {
    shortWindowMs: number; // 5 minutes
    longWindowMs: number; // 1 hour
    shortThreshold: number; // 14x burn rate
    longThreshold: number; // 6x burn rate
  };
  // Warning: 30min/6h windows
  warning: {
    shortWindowMs: number; // 30 minutes
    longWindowMs: number; // 6 hours
    shortThreshold: number; // 6x burn rate
    longThreshold: number; // 3x burn rate
  };
}

/**
 * SLO Burn Rate Alert System
 * Prevents alert fatigue with intelligent burn rate detection
 */
export class SLOBurnRateAlerts {
  private sliMetrics: SLIMetric[] = [];
  private alerts: BurnRateAlert[] = [];
  private sloTargets: Map<string, SLOTarget> = new Map();
  private readonly maxMetrics = 50000; // Keep ~6 hours of high-frequency data

  private readonly burnRateConfig: BurnRateConfig = {
    critical: {
      shortWindowMs: 5 * 60 * 1000, // 5 minutes
      longWindowMs: 60 * 60 * 1000, // 1 hour
      shortThreshold: 14, // 14x burn rate
      longThreshold: 6, // 6x burn rate
    },
    warning: {
      shortWindowMs: 30 * 60 * 1000, // 30 minutes
      longWindowMs: 6 * 60 * 60 * 1000, // 6 hours
      shortThreshold: 6, // 6x burn rate
      longThreshold: 3, // 3x burn rate
    },
  };

  constructor() {
    this.initializeDefaultSLOs();
    this.startPeriodicChecks();
  }

  /**
   * Record an SLI metric
   */
  recordSLI(
    route: string,
    provider: string,
    intent: string,
    latency: number
  ): void {
    const sloKey = this.getSLOKey(route, provider, intent);
    const slo = this.sloTargets.get(sloKey);

    if (!slo) {
      console.warn(`No SLO target found for ${sloKey}`);
      return;
    }

    const metric: SLIMetric = {
      timestamp: Date.now(),
      route,
      provider,
      intent,
      latency,
      isGood: latency <= slo.latencyThresholdMs,
    };

    this.sliMetrics.push(metric);

    // Maintain memory limits
    if (this.sliMetrics.length > this.maxMetrics) {
      this.sliMetrics = this.sliMetrics.slice(-this.maxMetrics);
    }
  }

  /**
   * Add or update SLO target
   */
  setSLOTarget(slo: SLOTarget): void {
    const key = this.getSLOKey(slo.route, slo.provider, slo.intent);
    this.sloTargets.set(key, slo);
  }

  /**
   * Calculate burn rate for a specific SLO
   */
  calculateBurnRate(
    slo: SLOTarget,
    windowMs: number
  ): {
    burnRate: number;
    goodRatio: number;
    totalRequests: number;
    goodRequests: number;
  } {
    const cutoff = Date.now() - windowMs;
    const relevantMetrics = this.sliMetrics.filter(
      (m) =>
        m.timestamp > cutoff &&
        m.route === slo.route &&
        (!slo.provider || m.provider === slo.provider) &&
        (!slo.intent || m.intent === slo.intent)
    );

    if (relevantMetrics.length === 0) {
      return {
        burnRate: 0,
        goodRatio: 1,
        totalRequests: 0,
        goodRequests: 0,
      };
    }

    const goodRequests = relevantMetrics.filter((m) => m.isGood).length;
    const totalRequests = relevantMetrics.length;
    const goodRatio = goodRequests / totalRequests;

    // Burn rate = (1 - goodRatio) / errorBudget
    // If goodRatio = 0.9 and errorBudget = 0.05, burnRate = 0.1 / 0.05 = 2x
    const burnRate = (1 - goodRatio) / slo.errorBudget;

    return {
      burnRate,
      goodRatio,
      totalRequests,
      goodRequests,
    };
  }

  /**
   * Check for burn rate violations and generate alerts
   */
  checkBurnRates(): void {
    for (const [sloKey, slo] of this.sloTargets) {
      this.checkSLOBurnRate(slo);
    }
  }

  /**
   * Check burn rate for a specific SLO
   */
  private checkSLOBurnRate(slo: SLOTarget): void {
    // Check critical thresholds (5min/1h)
    const criticalShort = this.calculateBurnRate(
      slo,
      this.burnRateConfig.critical.shortWindowMs
    );
    const criticalLong = this.calculateBurnRate(
      slo,
      this.burnRateConfig.critical.longWindowMs
    );

    if (
      criticalShort.burnRate > this.burnRateConfig.critical.shortThreshold &&
      criticalLong.burnRate > this.burnRateConfig.critical.longThreshold
    ) {
      this.generateBurnRateAlert(slo, "critical", criticalShort, criticalLong);
      return; // Don't check warning if critical is already firing
    }

    // Check warning thresholds (30min/6h)
    const warningShort = this.calculateBurnRate(
      slo,
      this.burnRateConfig.warning.shortWindowMs
    );
    const warningLong = this.calculateBurnRate(
      slo,
      this.burnRateConfig.warning.longWindowMs
    );

    if (
      warningShort.burnRate > this.burnRateConfig.warning.shortThreshold &&
      warningLong.burnRate > this.burnRateConfig.warning.longThreshold
    ) {
      this.generateBurnRateAlert(slo, "warning", warningShort, warningLong);
    }
  }

  /**
   * Generate burn rate alert
   */
  private generateBurnRateAlert(
    slo: SLOTarget,
    severity: "warning" | "critical",
    shortWindow: any,
    longWindow: any
  ): void {
    const alertId = `burn-rate-${slo.name}-${severity}-${Date.now()}`;

    // Check if similar alert already exists (anti-flapping)
    const existingAlert = this.alerts.find(
      (a) =>
        !a.resolved &&
        a.slo.name === slo.name &&
        a.severity === severity &&
        Date.now() - a.timestamp < 5 * 60 * 1000 // Within last 5 minutes
    );

    if (existingAlert) {
      return; // Don't create duplicate alerts
    }

    const alert: BurnRateAlert = {
      id: alertId,
      slo,
      burnRate: Math.max(shortWindow.burnRate, longWindow.burnRate),
      severity,
      shortWindow: {
        duration:
          severity === "critical"
            ? this.burnRateConfig.critical.shortWindowMs
            : this.burnRateConfig.warning.shortWindowMs,
        goodRatio: shortWindow.goodRatio,
        threshold:
          severity === "critical"
            ? this.burnRateConfig.critical.shortThreshold
            : this.burnRateConfig.warning.shortThreshold,
      },
      longWindow: {
        duration:
          severity === "critical"
            ? this.burnRateConfig.critical.longWindowMs
            : this.burnRateConfig.warning.longWindowMs,
        goodRatio: longWindow.goodRatio,
        threshold:
          severity === "critical"
            ? this.burnRateConfig.critical.longThreshold
            : this.burnRateConfig.warning.longThreshold,
      },
      timestamp: Date.now(),
      resolved: false,
    };

    this.alerts.push(alert);

    console.warn(
      `🚨 SLO Burn Rate Alert [${severity.toUpperCase()}]: ${slo.name}`,
      {
        burnRate: alert.burnRate.toFixed(2),
        shortWindow: `${(shortWindow.goodRatio * 100).toFixed(
          1
        )}% good (${this.formatDuration(alert.shortWindow.duration)})`,
        longWindow: `${(longWindow.goodRatio * 100).toFixed(
          1
        )}% good (${this.formatDuration(alert.longWindow.duration)})`,
        errorBudget: `${(slo.errorBudget * 100).toFixed(1)}%`,
        sloTarget: `${(slo.sloTarget * 100).toFixed(1)}%`,
      }
    );

    // Emit event for external handling
    this.emit("burnRateAlert", alert);
  }

  /**
   * Get current SLO status for all targets
   */
  getSLOStatus(): Array<{
    slo: SLOTarget;
    currentGoodRatio: number;
    burnRate: number;
    status: "healthy" | "warning" | "critical";
    timeToExhaustion?: string;
  }> {
    const results = [];

    for (const [sloKey, slo] of this.sloTargets) {
      const shortWindow = this.calculateBurnRate(
        slo,
        this.burnRateConfig.critical.shortWindowMs
      );
      const longWindow = this.calculateBurnRate(
        slo,
        this.burnRateConfig.critical.longWindowMs
      );

      let status: "healthy" | "warning" | "critical" = "healthy";

      if (
        shortWindow.burnRate > this.burnRateConfig.critical.shortThreshold &&
        longWindow.burnRate > this.burnRateConfig.critical.longThreshold
      ) {
        status = "critical";
      } else if (
        shortWindow.burnRate > this.burnRateConfig.warning.shortThreshold &&
        longWindow.burnRate > this.burnRateConfig.warning.longThreshold
      ) {
        status = "warning";
      }

      // Calculate time to exhaustion if burning error budget
      let timeToExhaustion: string | undefined;
      if (shortWindow.burnRate > 1) {
        const hoursToExhaustion = (30 * 24) / shortWindow.burnRate; // 30 days / burn rate
        timeToExhaustion =
          hoursToExhaustion < 24
            ? `${hoursToExhaustion.toFixed(1)} hours`
            : `${(hoursToExhaustion / 24).toFixed(1)} days`;
      }

      results.push({
        slo,
        currentGoodRatio: shortWindow.goodRatio,
        burnRate: shortWindow.burnRate,
        status,
        timeToExhaustion,
      });
    }

    return results;
  }

  /**
   * Get active burn rate alerts
   */
  getActiveAlerts(): BurnRateAlert[] {
    return this.alerts.filter((a) => !a.resolved);
  }

  /**
   * Resolve alert by ID
   */
  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find((a) => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      return true;
    }
    return false;
  }

  /**
   * Initialize default SLO targets
   */
  private initializeDefaultSLOs(): void {
    const defaultSLOs: SLOTarget[] = [
      {
        name: "Generation P95",
        route: "generation",
        latencyThresholdMs: 1500,
        sloTarget: 0.95,
        errorBudget: 0.05,
      },
      {
        name: "RAG P95",
        route: "rag",
        latencyThresholdMs: 300,
        sloTarget: 0.95,
        errorBudget: 0.05,
      },
      {
        name: "Cached P95",
        route: "cached",
        latencyThresholdMs: 300,
        sloTarget: 0.98, // Higher target for cached responses
        errorBudget: 0.02,
      },
    ];

    defaultSLOs.forEach((slo) => this.setSLOTarget(slo));
  }

  /**
   * Start periodic burn rate checks
   */
  private startPeriodicChecks(): void {
    setInterval(() => {
      this.checkBurnRates();
      this.cleanupOldData();
    }, 60 * 1000); // Check every minute
  }

  /**
   * Clean up old metrics and resolved alerts
   */
  private cleanupOldData(): void {
    const cutoff = Date.now() - 6 * 60 * 60 * 1000; // Keep 6 hours

    // Clean old metrics
    this.sliMetrics = this.sliMetrics.filter((m) => m.timestamp > cutoff);

    // Clean old resolved alerts
    const alertCutoff = Date.now() - 24 * 60 * 60 * 1000; // Keep 24 hours
    this.alerts = this.alerts.filter(
      (a) => !a.resolved || a.timestamp > alertCutoff
    );
  }

  /**
   * Generate SLO key for lookup
   */
  private getSLOKey(route: string, provider?: string, intent?: string): string {
    return `${route}:${provider || "*"}:${intent || "*"}`;
  }

  /**
   * Format duration in human-readable format
   */
  private formatDuration(ms: number): string {
    const minutes = Math.floor(ms / (60 * 1000));
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h${minutes % 60}m`;
    }
    return `${minutes}m`;
  }

  /**
   * Simple event emitter for alerts
   */
  private emit(event: string, data: any): void {
    // In production, this would integrate with actual event system
    console.log(`Event: ${event}`, data);
  }
}

// Singleton instance
export const sloBurnRateAlerts = new SLOBurnRateAlerts();
