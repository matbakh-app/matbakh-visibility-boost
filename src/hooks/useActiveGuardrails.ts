/**
 * React Hook for Active Guardrails Management
 */

import { useCallback, useEffect, useState } from "react";

export interface GuardrailsConfig {
  enablePIIDetection: boolean;
  enableToxicityDetection: boolean;
  enablePromptInjection: boolean;
  enableBedrockGuardrails: boolean;
  strictMode: boolean;
  logViolations: boolean;
  blockOnViolation: boolean;
  redactionMode: "MASK" | "REMOVE" | "REPLACE";
}

export interface GuardrailsMetrics {
  totalRequests: number;
  blockedRequests: number;
  piiDetections: number;
  toxicityDetections: number;
  promptInjections: number;
  averageProcessingTime: number;
  successRate: number;
  lastUpdated: Date;
}

export interface GuardrailsViolation {
  id: string;
  timestamp: Date;
  type: "PII" | "TOXICITY" | "PROMPT_INJECTION" | "BEDROCK_ARCHITECTURAL";
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  details: string;
  provider: string;
  domain: string;
  blocked: boolean;
}

export interface UseActiveGuardrailsReturn {
  config: GuardrailsConfig | null;
  metrics: GuardrailsMetrics | null;
  recentViolations: GuardrailsViolation[];
  systemHealth: "healthy" | "degraded" | "error";
  loading: boolean;
  error: string | null;
  updateConfig: (newConfig: Partial<GuardrailsConfig>) => Promise<void>;
  refreshData: () => Promise<void>;
  testGuardrails: (content: string, provider: string) => Promise<any>;
  exportViolations: (timeRange: string) => Promise<void>;
}

export const useActiveGuardrails = (): UseActiveGuardrailsReturn => {
  const [config, setConfig] = useState<GuardrailsConfig | null>(null);
  const [metrics, setMetrics] = useState<GuardrailsMetrics | null>(null);
  const [recentViolations, setRecentViolations] = useState<
    GuardrailsViolation[]
  >([]);
  const [systemHealth, setSystemHealth] = useState<
    "healthy" | "degraded" | "error"
  >("healthy");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch guardrails data
  const fetchGuardrailsData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // In a real implementation, these would be actual API calls
      // For now, we'll simulate the API responses

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Mock configuration
      const mockConfig: GuardrailsConfig = {
        enablePIIDetection: true,
        enableToxicityDetection: true,
        enablePromptInjection: true,
        enableBedrockGuardrails: true,
        strictMode: false,
        logViolations: true,
        blockOnViolation: true,
        redactionMode: "MASK",
      };

      // Mock metrics
      const mockMetrics: GuardrailsMetrics = {
        totalRequests: Math.floor(Math.random() * 2000) + 1000,
        blockedRequests: Math.floor(Math.random() * 50) + 10,
        piiDetections: Math.floor(Math.random() * 30) + 5,
        toxicityDetections: Math.floor(Math.random() * 20) + 3,
        promptInjections: Math.floor(Math.random() * 10) + 1,
        averageProcessingTime: Math.floor(Math.random() * 100) + 30,
        successRate: 98 + Math.random() * 2,
        lastUpdated: new Date(),
      };

      // Mock recent violations
      const mockViolations: GuardrailsViolation[] = [
        {
          id: "v1",
          timestamp: new Date(Date.now() - 1000 * 60 * 15),
          type: "PII",
          severity: "HIGH",
          details: "Email address detected in prompt",
          provider: "google",
          domain: "culinary",
          blocked: true,
        },
        {
          id: "v2",
          timestamp: new Date(Date.now() - 1000 * 60 * 30),
          type: "TOXICITY",
          severity: "MEDIUM",
          details: "Profanity detected in user input",
          provider: "meta",
          domain: "general",
          blocked: true,
        },
        {
          id: "v3",
          timestamp: new Date(Date.now() - 1000 * 60 * 45),
          type: "BEDROCK_ARCHITECTURAL",
          severity: "HIGH",
          details: "Bedrock used for user task - delegated to Google",
          provider: "bedrock",
          domain: "culinary",
          blocked: false,
        },
      ];

      setConfig(mockConfig);
      setMetrics(mockMetrics);
      setRecentViolations(mockViolations);

      // Determine system health based on metrics
      const errorRate =
        (mockMetrics.blockedRequests / mockMetrics.totalRequests) * 100;
      if (errorRate > 5) {
        setSystemHealth("error");
      } else if (errorRate > 2) {
        setSystemHealth("degraded");
      } else {
        setSystemHealth("healthy");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch guardrails data"
      );
      setSystemHealth("error");
    } finally {
      setLoading(false);
    }
  }, []);

  // Update configuration
  const updateConfig = useCallback(
    async (newConfig: Partial<GuardrailsConfig>) => {
      try {
        setError(null);

        // In a real implementation, this would be an API call
        console.log("Updating guardrails config:", newConfig);

        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 300));

        setConfig((prev) => (prev ? { ...prev, ...newConfig } : null));

        // Refresh data after config update
        await fetchGuardrailsData();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to update configuration"
        );
        throw err;
      }
    },
    [fetchGuardrailsData]
  );

  // Refresh data manually
  const refreshData = useCallback(async () => {
    await fetchGuardrailsData();
  }, [fetchGuardrailsData]);

  // Test guardrails with sample content
  const testGuardrails = useCallback(
    async (content: string, provider: string) => {
      try {
        setError(null);

        // In a real implementation, this would call the actual guardrails service
        console.log("Testing guardrails:", { content, provider });

        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Mock test result
        const mockResult = {
          allowed: !content.toLowerCase().includes("test-block"),
          confidence: Math.random(),
          violations: content.toLowerCase().includes("email")
            ? [
                {
                  type: "PII",
                  severity: "HIGH",
                  details: "Email pattern detected",
                  confidence: 0.95,
                },
              ]
            : [],
          processingTimeMs: Math.floor(Math.random() * 100) + 20,
          guardrailsApplied: ["pii-toxicity-detection", `${provider}-specific`],
        };

        return mockResult;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to test guardrails"
        );
        throw err;
      }
    },
    []
  );

  // Export violations data
  const exportViolations = useCallback(
    async (timeRange: string) => {
      try {
        setError(null);

        // In a real implementation, this would generate and download a report
        console.log("Exporting violations for time range:", timeRange);

        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Mock CSV generation
        const csvData = recentViolations
          .map(
            (v) =>
              `${v.timestamp.toISOString()},${v.type},${v.severity},${
                v.provider
              },${v.domain},${v.blocked}`
          )
          .join("\n");

        const header = "Timestamp,Type,Severity,Provider,Domain,Blocked\n";
        const fullCsv = header + csvData;

        // Create and download file
        const blob = new Blob([fullCsv], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `guardrails-violations-${timeRange}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to export violations"
        );
        throw err;
      }
    },
    [recentViolations]
  );

  // Initial data fetch and polling setup
  useEffect(() => {
    fetchGuardrailsData();

    // Set up polling for real-time updates
    const interval = setInterval(fetchGuardrailsData, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [fetchGuardrailsData]);

  return {
    config,
    metrics,
    recentViolations,
    systemHealth,
    loading,
    error,
    updateConfig,
    refreshData,
    testGuardrails,
    exportViolations,
  };
};
