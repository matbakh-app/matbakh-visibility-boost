/**
 * GDPR Compliance Hook
 *
 * React hook for managing GDPR compliance validation and reporting.
 * Provides real-time compliance monitoring and data export capabilities.
 */

import { useCallback, useEffect, useState } from "react";
import {
  GDPRComplianceReport,
  GDPRComplianceValidator,
} from "../lib/compliance/gdpr-compliance-validator";

interface UseGDPRComplianceOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  onComplianceChange?: (report: GDPRComplianceReport) => void;
}

interface UseGDPRComplianceReturn {
  report: GDPRComplianceReport | null;
  loading: boolean;
  error: string | null;
  refreshCompliance: () => Promise<void>;
  downloadReport: () => Promise<void>;
  exportData: () => Promise<void>;
  isCompliant: boolean;
  complianceScore: number;
  criticalIssues: string[];
}

export const useGDPRCompliance = (
  options: UseGDPRComplianceOptions = {}
): UseGDPRComplianceReturn => {
  const {
    autoRefresh = false,
    refreshInterval = 300000, // 5 minutes
    onComplianceChange,
  } = options;

  const [report, setReport] = useState<GDPRComplianceReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [validator] = useState(() => new GDPRComplianceValidator());

  const refreshCompliance = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const newReport = await validator.validateCompliance();
      setReport(newReport);

      if (onComplianceChange) {
        onComplianceChange(newReport);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to validate GDPR compliance";
      setError(errorMessage);
      console.error("GDPR compliance validation error:", err);
    } finally {
      setLoading(false);
    }
  }, [validator, onComplianceChange]);

  const downloadReport = useCallback(async () => {
    try {
      const markdown = await validator.generateComplianceReport();
      const blob = new Blob([markdown], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `gdpr-compliance-report-${
        new Date().toISOString().split("T")[0]
      }.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      const errorMessage = "Failed to download GDPR compliance report";
      setError(errorMessage);
      console.error("Download report error:", err);
      throw new Error(errorMessage);
    }
  }, [validator]);

  const exportData = useCallback(async () => {
    try {
      const data = await validator.exportComplianceData();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `gdpr-compliance-data-${
        new Date().toISOString().split("T")[0]
      }.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      const errorMessage = "Failed to export GDPR compliance data";
      setError(errorMessage);
      console.error("Export data error:", err);
      throw new Error(errorMessage);
    }
  }, [validator]);

  // Initial load
  useEffect(() => {
    refreshCompliance();
  }, [refreshCompliance]);

  // Auto-refresh setup
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refreshCompliance();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, refreshCompliance]);

  // Derived values
  const isCompliant = report?.overallStatus === "compliant";
  const complianceScore = report?.complianceScore ?? 0;
  const criticalIssues = report
    ? Object.values(report.summary).flatMap((summary) => summary.criticalIssues)
    : [];

  return {
    report,
    loading,
    error,
    refreshCompliance,
    downloadReport,
    exportData,
    isCompliant,
    complianceScore,
    criticalIssues,
  };
};
