/**
 * Performance Monitor
 *
 * Tracks performance metrics, SLO compliance, and automated rollback triggers
 */

import { AiRequest, AiResponse } from "./types";

export interface PerformanceMetrics {
  requestCount: number;
  successCount: number;
  errorCount: number;
  errorRate: number;
  averageLatency: number;
  p95Latency: number;
  p99Latency: number;
  totalCost: number;
  costPerRequest: number;
}

export interface ProviderMetrics extends PerformanceMetrics {
  provider: string;
  availability: number;
  circuitBreakerOpen: boolean;
}

export interface SLO {
  name: string;
  threshold: number;
  currentValue: number;
  violated: boolean;
}

export interface Alert {
  id: string;
  slo: SLO;
  currentValue: number;
  threshold: number;
  severity: "warning" | "critical";
  timestamp: Date;
}

export interface PerformanceSummary {
  healthy: boolean;
  globalMetrics: PerformanceMetrics | null;
  providerCount: number;
  activeAlerts: number;
  criticalAlerts: number;
  sloCompliance: number;
}

interface RequestRecord {
  requestId: string;
  request: AiRequest;
  response: AiResponse;
  startTime: number;
  endTime: number;
  latency: number;
}

export class PerformanceMonitor {
  private requests: Map<string, RequestRecord> = new Map();
  private alerts: Alert[] = [];
  private slos: SLO[] = [
    { name: "P95 Latency", threshold: 1500, currentValue: 0, violated: false },
    { name: "Error Rate", threshold: 0.01, currentValue: 0, violated: false },
    { name: "Availability", threshold: 0.99, currentValue: 1, violated: false },
  ];

  recordRequestStart(request: AiRequest): string {
    const requestId = `req-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    return requestId;
  }

  recordRequestComplete(
    requestId: string,
    request: AiRequest,
    response: AiResponse,
    startTime: number
  ): void {
    const endTime = Date.now();
    const latency = endTime - startTime;

    const record: RequestRecord = {
      requestId,
      request,
      response,
      startTime,
      endTime,
      latency,
    };

    this.requests.set(requestId, record);
    this.updateSLOs();
    this.checkAlerts();
  }

  getGlobalMetrics(): PerformanceMetrics | null {
    if (this.requests.size === 0) return null;

    const records = Array.from(this.requests.values());
    const successCount = records.filter((r) => r.response.success).length;
    const errorCount = records.filter((r) => !r.response.success).length;
    const latencies = records.map((r) => r.latency).sort((a, b) => a - b);
    const costs = records.map((r) => r.response.costEuro || 0);

    return {
      requestCount: records.length,
      successCount,
      errorCount,
      errorRate: errorCount / records.length,
      averageLatency: latencies.reduce((a, b) => a + b, 0) / latencies.length,
      p95Latency: this.calculatePercentile(latencies, 0.95),
      p99Latency: this.calculatePercentile(latencies, 0.99),
      totalCost: costs.reduce((a, b) => a + b, 0),
      costPerRequest: costs.reduce((a, b) => a + b, 0) / records.length,
    };
  }

  getProviderMetrics(provider: string): ProviderMetrics[] {
    const records = Array.from(this.requests.values()).filter(
      (r) => r.response.provider === provider
    );

    if (records.length === 0) return [];

    const successCount = records.filter((r) => r.response.success).length;
    const errorCount = records.filter((r) => !r.response.success).length;
    const latencies = records.map((r) => r.latency).sort((a, b) => a - b);
    const costs = records.map((r) => r.response.costEuro || 0);

    return [
      {
        provider,
        requestCount: records.length,
        successCount,
        errorCount,
        errorRate: errorCount / records.length,
        averageLatency: latencies.reduce((a, b) => a + b, 0) / latencies.length,
        p95Latency: this.calculatePercentile(latencies, 0.95),
        p99Latency: this.calculatePercentile(latencies, 0.99),
        totalCost: costs.reduce((a, b) => a + b, 0),
        costPerRequest: costs.reduce((a, b) => a + b, 0) / records.length,
        availability: successCount / records.length,
        circuitBreakerOpen: errorCount / records.length > 0.5,
      },
    ];
  }

  getActiveAlerts(): Alert[] {
    return this.alerts;
  }

  resolveAlert(alertId: string): boolean {
    const index = this.alerts.findIndex((a) => a.id === alertId);
    if (index !== -1) {
      this.alerts.splice(index, 1);
      return true;
    }
    return false;
  }

  isPerformanceHealthy(): boolean {
    const criticalAlerts = this.alerts.filter((a) => a.severity === "critical");
    return criticalAlerts.length === 0;
  }

  getPerformanceSummary(): PerformanceSummary {
    const globalMetrics = this.getGlobalMetrics();
    const providers = new Set(
      Array.from(this.requests.values()).map((r) => r.response.provider)
    );
    const criticalAlerts = this.alerts.filter((a) => a.severity === "critical");
    const violatedSLOs = this.slos.filter((s) => s.violated).length;
    const sloCompliance = 1 - violatedSLOs / this.slos.length;

    return {
      healthy: this.isPerformanceHealthy(),
      globalMetrics,
      providerCount: providers.size,
      activeAlerts: this.alerts.length,
      criticalAlerts: criticalAlerts.length,
      sloCompliance,
    };
  }

  reset(): void {
    this.requests.clear();
    this.alerts = [];
    this.slos.forEach((slo) => {
      slo.currentValue = 0;
      slo.violated = false;
    });
  }

  private calculatePercentile(
    sortedValues: number[],
    percentile: number
  ): number {
    if (sortedValues.length === 0) return 0;
    const index = Math.ceil(sortedValues.length * percentile) - 1;
    return sortedValues[Math.max(0, index)];
  }

  private updateSLOs(): void {
    const metrics = this.getGlobalMetrics();
    if (!metrics) return;

    // Update P95 Latency SLO
    const p95Slo = this.slos.find((s) => s.name === "P95 Latency");
    if (p95Slo) {
      p95Slo.currentValue = metrics.p95Latency;
      p95Slo.violated = metrics.p95Latency > p95Slo.threshold;
    }

    // Update Error Rate SLO
    const errorSlo = this.slos.find((s) => s.name === "Error Rate");
    if (errorSlo) {
      errorSlo.currentValue = metrics.errorRate;
      errorSlo.violated = metrics.errorRate > errorSlo.threshold;
    }

    // Update Availability SLO
    const availabilitySlo = this.slos.find((s) => s.name === "Availability");
    if (availabilitySlo) {
      const availability = metrics.successCount / metrics.requestCount;
      availabilitySlo.currentValue = availability;
      availabilitySlo.violated = availability < availabilitySlo.threshold;
    }
  }

  private checkAlerts(): void {
    this.slos.forEach((slo) => {
      if (slo.violated) {
        const existingAlert = this.alerts.find((a) => a.slo.name === slo.name);
        if (!existingAlert) {
          const severity = this.determineSeverity(slo);
          this.alerts.push({
            id: `alert-${Date.now()}-${Math.random()
              .toString(36)
              .substr(2, 9)}`,
            slo: { ...slo },
            currentValue: slo.currentValue,
            threshold: slo.threshold,
            severity,
            timestamp: new Date(),
          });
        }
      }
    });
  }

  private determineSeverity(slo: SLO): "warning" | "critical" {
    const ratio = slo.currentValue / slo.threshold;

    if (slo.name === "P95 Latency") {
      return ratio > 2 ? "critical" : "warning";
    }

    if (slo.name === "Error Rate") {
      return ratio > 10 ? "critical" : "warning";
    }

    if (slo.name === "Availability") {
      return slo.currentValue < 0.95 ? "critical" : "warning";
    }

    return "warning";
  }
}

export function createPerformanceMonitor(): PerformanceMonitor {
  return new PerformanceMonitor();
}
