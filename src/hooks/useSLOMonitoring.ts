/**
 * React Hook for SLO Monitoring
 *
 * Provides reactive access to SLO monitoring data and real-time updates
 */

import {
  SLOAlert,
  SLODefinition,
  sloMonitoringService,
  SLOReport,
  SLOStatus,
} from "@/lib/monitoring/slo-monitoring-service";
import { useCallback, useEffect, useState } from "react";

interface SLOMonitoringState {
  sloDefinitions: SLODefinition[];
  sloStatuses: SLOStatus[];
  activeAlerts: SLOAlert[];
  allAlerts: SLOAlert[];
  systemHealth: {
    overall: "healthy" | "degraded" | "critical";
    sloCompliance: number;
    activeAlerts: number;
    criticalAlerts: number;
    services: Array<{
      name: string;
      status: "up" | "down" | "degraded";
      uptime: number;
    }>;
  };
  isLoading: boolean;
  lastUpdated: Date;
  error: string | null;
}

interface SLOMonitoringActions {
  refreshData: () => Promise<void>;
  resolveAlert: (alertId: string) => boolean;
  generateReport: (startDate?: Date, endDate?: Date) => SLOReport;
  getSLOStatus: (sloId: string) => SLOStatus | undefined;
  getSLODefinition: (sloId: string) => SLODefinition | undefined;
}

export interface UseSLOMonitoringReturn
  extends SLOMonitoringState,
    SLOMonitoringActions {}

export const useSLOMonitoring = (options?: {
  autoRefresh?: boolean;
  refreshInterval?: number;
}): UseSLOMonitoringReturn => {
  const { autoRefresh = true, refreshInterval = 30000 } = options || {};

  const [state, setState] = useState<SLOMonitoringState>({
    sloDefinitions: [],
    sloStatuses: [],
    activeAlerts: [],
    allAlerts: [],
    systemHealth: {
      overall: "healthy",
      sloCompliance: 100,
      activeAlerts: 0,
      criticalAlerts: 0,
      services: [],
    },
    isLoading: true,
    lastUpdated: new Date(),
    error: null,
  });

  /**
   * Load SLO monitoring data
   */
  const loadData = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      const sloDefinitions = sloMonitoringService.getSLODefinitions();
      const sloStatuses = sloMonitoringService.getSLOStatuses();
      const activeAlerts = sloMonitoringService.getActiveAlerts();
      const allAlerts = sloMonitoringService.getAllAlerts();
      const systemHealth = sloMonitoringService.getSystemHealthSummary();

      setState((prev) => ({
        ...prev,
        sloDefinitions,
        sloStatuses,
        activeAlerts,
        allAlerts,
        systemHealth,
        isLoading: false,
        lastUpdated: new Date(),
        error: null,
      }));
    } catch (error) {
      console.error("Failed to load SLO monitoring data:", error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      }));
    }
  }, []);

  /**
   * Refresh data manually
   */
  const refreshData = useCallback(async () => {
    await loadData();
  }, [loadData]);

  /**
   * Resolve an alert
   */
  const resolveAlert = useCallback(
    (alertId: string): boolean => {
      const resolved = sloMonitoringService.resolveAlert(alertId);
      if (resolved) {
        // Refresh data to reflect the change
        loadData();
      }
      return resolved;
    },
    [loadData]
  );

  /**
   * Generate SLO report
   */
  const generateReport = useCallback(
    (startDate?: Date, endDate?: Date): SLOReport => {
      return sloMonitoringService.generateReport(startDate, endDate);
    },
    []
  );

  /**
   * Get SLO status by ID
   */
  const getSLOStatus = useCallback((sloId: string): SLOStatus | undefined => {
    return sloMonitoringService.getSLOStatus(sloId);
  }, []);

  /**
   * Get SLO definition by ID
   */
  const getSLODefinition = useCallback(
    (sloId: string): SLODefinition | undefined => {
      return sloMonitoringService.getSLODefinition(sloId);
    },
    []
  );

  // Set up event listeners for real-time updates
  useEffect(() => {
    const handleSLOStatusChange = () => {
      loadData();
    };

    const handleAlert = () => {
      loadData();
    };

    const handleAlertResolved = () => {
      loadData();
    };

    // Subscribe to events
    sloMonitoringService.on("sloStatusChange", handleSLOStatusChange);
    sloMonitoringService.on("alert", handleAlert);
    sloMonitoringService.on("alertResolved", handleAlertResolved);

    // Initial data load
    loadData();

    // Cleanup
    return () => {
      sloMonitoringService.off("sloStatusChange", handleSLOStatusChange);
      sloMonitoringService.off("alert", handleAlert);
      sloMonitoringService.off("alertResolved", handleAlertResolved);
    };
  }, [loadData]);

  // Set up auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, loadData]);

  return {
    ...state,
    refreshData,
    resolveAlert,
    generateReport,
    getSLOStatus,
    getSLODefinition,
  };
};

/**
 * Hook for specific SLO monitoring
 */
export const useSLO = (sloId: string) => {
  const { sloStatuses, sloDefinitions, getSLOStatus, getSLODefinition } =
    useSLOMonitoring();

  const sloStatus = getSLOStatus(sloId);
  const sloDefinition = getSLODefinition(sloId);

  return {
    sloStatus,
    sloDefinition,
    isLoading: !sloStatus || !sloDefinition,
    exists: !!sloStatus && !!sloDefinition,
  };
};

/**
 * Hook for SLO alerts
 */
export const useSLOAlerts = (options?: {
  severity?: "info" | "warning" | "critical";
  sloId?: string;
  resolved?: boolean;
}) => {
  const { activeAlerts, allAlerts, resolveAlert } = useSLOMonitoring();

  const filteredAlerts = (
    options?.resolved === false ? activeAlerts : allAlerts
  ).filter((alert) => {
    if (options?.severity && alert.severity !== options.severity) return false;
    if (options?.sloId && alert.sloId !== options.sloId) return false;
    if (options?.resolved !== undefined && alert.resolved !== options.resolved)
      return false;
    return true;
  });

  return {
    alerts: filteredAlerts,
    alertCount: filteredAlerts.length,
    criticalCount: filteredAlerts.filter((a) => a.severity === "critical")
      .length,
    warningCount: filteredAlerts.filter((a) => a.severity === "warning").length,
    infoCount: filteredAlerts.filter((a) => a.severity === "info").length,
    resolveAlert,
  };
};

/**
 * Hook for system health summary
 */
export const useSystemHealth = () => {
  const { systemHealth, sloStatuses, isLoading, error } = useSLOMonitoring();

  const healthySLOs = sloStatuses.filter((s) => s.status === "healthy").length;
  const warningSLOs = sloStatuses.filter((s) => s.status === "warning").length;
  const criticalSLOs = sloStatuses.filter(
    (s) => s.status === "critical"
  ).length;
  const totalSLOs = sloStatuses.length;

  const complianceByCategory = sloStatuses.reduce((acc, status) => {
    const definition = sloMonitoringService.getSLODefinition(status.sloId);
    if (definition) {
      if (!acc[definition.category]) {
        acc[definition.category] = { total: 0, compliant: 0 };
      }
      acc[definition.category].total++;
      if (status.status === "healthy") {
        acc[definition.category].compliant++;
      }
    }
    return acc;
  }, {} as Record<string, { total: number; compliant: number }>);

  return {
    ...systemHealth,
    sloBreakdown: {
      healthy: healthySLOs,
      warning: warningSLOs,
      critical: criticalSLOs,
      total: totalSLOs,
    },
    complianceByCategory,
    isLoading,
    error,
  };
};
