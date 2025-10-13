/**
 * Provider Compliance Hook
 *
 * React hook for managing provider agreement compliance
 */

import { useCallback, useEffect, useState } from "react";

export interface ProviderAgreement {
  providerId: string;
  providerName: string;
  agreementId: string;
  signedDate: string;
  expiryDate: string;
  version: string;
  noTrainingOnCustomerData: boolean;
  dataProcessingAgreement: boolean;
  gdprCompliant: boolean;
  euDataResidency: boolean;
  lastVerified: string;
  verificationStatus: "verified" | "pending" | "expired" | "violated";
}

export interface ComplianceViolation {
  violationId: string;
  providerId: string;
  timestamp: string;
  violationType: string;
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  status: "open" | "investigating" | "resolved" | "false_positive";
}

export interface ComplianceReport {
  reportId: string;
  generatedAt: string;
  overallCompliance: "compliant" | "non_compliant" | "warning";
  complianceScore: number;
  providers: Array<{
    providerId: string;
    compliant: boolean;
    agreementStatus: "active" | "expired" | "missing";
    lastVerified: string;
    violations: number;
  }>;
  violations: {
    total: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
    resolved: number;
    pending: number;
  };
  recommendations: string[];
  nextActions: Array<{
    action: string;
    priority: "low" | "medium" | "high" | "critical";
    dueDate: string;
  }>;
}

export interface ComplianceCheckResult {
  allowed: boolean;
  provider: string;
  violations: string[];
  warnings: string[];
  complianceScore: number;
  agreementStatus: "active" | "expired" | "missing";
  lastVerified: string;
}

export interface UseProviderComplianceReturn {
  // Data
  agreements: ProviderAgreement[];
  violations: ComplianceViolation[];
  report: ComplianceReport | null;

  // State
  loading: boolean;
  error: string | null;

  // Actions
  loadComplianceData: () => Promise<void>;
  verifyProviderCompliance: (
    providerId: string
  ) => Promise<ComplianceCheckResult>;
  recordViolation: (
    violation: Omit<ComplianceViolation, "violationId" | "timestamp" | "status">
  ) => Promise<string>;
  resolveViolation: (
    violationId: string,
    resolutionNotes: string
  ) => Promise<void>;
  updateAgreementVerification: (
    providerId: string,
    verificationStatus: ProviderAgreement["verificationStatus"],
    evidence?: string
  ) => Promise<void>;
  generateComplianceReport: (
    startDate: string,
    endDate: string
  ) => Promise<ComplianceReport>;

  // Utilities
  getAgreement: (providerId: string) => ProviderAgreement | undefined;
  isProviderCompliant: (providerId: string) => boolean;
  getExpiringAgreements: (daysThreshold?: number) => ProviderAgreement[];
  getOpenViolations: () => ComplianceViolation[];
}

export const useProviderCompliance = (): UseProviderComplianceReturn => {
  const [agreements, setAgreements] = useState<ProviderAgreement[]>([]);
  const [violations, setViolations] = useState<ComplianceViolation[]>([]);
  const [report, setReport] = useState<ComplianceReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize with mock data (in real implementation, this would be API calls)
  const initializeMockData = useCallback(() => {
    const mockAgreements: ProviderAgreement[] = [
      {
        providerId: "bedrock",
        providerName: "Amazon Web Services (Bedrock)",
        agreementId: "AWS-BEDROCK-DPA-2024",
        signedDate: "2024-01-15T00:00:00Z",
        expiryDate: "2030-12-31T23:59:59Z",
        version: "2024.1",
        noTrainingOnCustomerData: true,
        dataProcessingAgreement: true,
        gdprCompliant: true,
        euDataResidency: true,
        lastVerified: new Date().toISOString(),
        verificationStatus: "verified",
      },
      {
        providerId: "google",
        providerName: "Google Cloud AI Platform",
        agreementId: "GOOGLE-AI-DPA-2024",
        signedDate: "2024-02-01T00:00:00Z",
        expiryDate: "2030-12-31T23:59:59Z",
        version: "2024.1",
        noTrainingOnCustomerData: true,
        dataProcessingAgreement: true,
        gdprCompliant: true,
        euDataResidency: true,
        lastVerified: new Date().toISOString(),
        verificationStatus: "verified",
      },
      {
        providerId: "meta",
        providerName: "Meta AI Platform",
        agreementId: "META-AI-DPA-2024",
        signedDate: "2024-03-01T00:00:00Z",
        expiryDate: "2030-12-31T23:59:59Z",
        version: "2024.1",
        noTrainingOnCustomerData: true,
        dataProcessingAgreement: true,
        gdprCompliant: true,
        euDataResidency: false, // Meta processes in US
        lastVerified: new Date().toISOString(),
        verificationStatus: "verified",
      },
    ];

    setAgreements(mockAgreements);
    setViolations([]);
  }, []);

  useEffect(() => {
    initializeMockData();
  }, [initializeMockData]);

  const loadComplianceData = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      // In a real implementation, this would be API calls
      // For now, we simulate loading delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Generate mock report
      const mockReport: ComplianceReport = {
        reportId: "report-" + Date.now(),
        generatedAt: new Date().toISOString(),
        overallCompliance: "compliant",
        complianceScore: 100,
        providers: agreements.map((a) => ({
          providerId: a.providerId,
          compliant: true,
          agreementStatus: "active" as const,
          lastVerified: a.lastVerified,
          violations: 0,
        })),
        violations: {
          total: violations.length,
          byType: {},
          bySeverity: {},
          resolved: violations.filter((v) => v.status === "resolved").length,
          pending: violations.filter(
            (v) => v.status === "open" || v.status === "investigating"
          ).length,
        },
        recommendations: [],
        nextActions: [],
      };

      setReport(mockReport);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load compliance data"
      );
    } finally {
      setLoading(false);
    }
  }, [agreements, violations]);

  const verifyProviderCompliance = useCallback(
    async (providerId: string): Promise<ComplianceCheckResult> => {
      const agreement = agreements.find((a) => a.providerId === providerId);
      const violations: string[] = [];
      const warnings: string[] = [];

      if (!agreement) {
        return {
          allowed: false,
          provider: providerId,
          violations: [`No agreement found for provider: ${providerId}`],
          warnings: [],
          complianceScore: 0,
          agreementStatus: "missing",
          lastVerified: "never",
        };
      }

      // Check agreement expiry
      const now = new Date();
      const expiryDate = new Date(agreement.expiryDate);
      let agreementStatus: ComplianceCheckResult["agreementStatus"] = "active";

      if (now > expiryDate) {
        agreementStatus = "expired";
        violations.push(`Agreement expired on ${agreement.expiryDate}`);
      }

      // Check core compliance requirements
      if (!agreement.noTrainingOnCustomerData) {
        violations.push(
          "Provider does not guarantee no training on customer data"
        );
      }

      if (!agreement.dataProcessingAgreement) {
        violations.push("No valid Data Processing Agreement");
      }

      if (!agreement.gdprCompliant) {
        violations.push("Provider is not GDPR compliant");
      }

      // Check verification status
      if (agreement.verificationStatus !== "verified") {
        violations.push(
          `Agreement verification status: ${agreement.verificationStatus}`
        );
      }

      // Check last verification date
      const lastVerified = new Date(agreement.lastVerified);
      const daysSinceVerification =
        (now.getTime() - lastVerified.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceVerification > 90) {
        warnings.push(
          `Agreement not verified in ${Math.floor(daysSinceVerification)} days`
        );
      }

      const complianceScore = Math.max(
        0,
        100 - violations.length * 25 - warnings.length * 10
      );

      return {
        allowed: violations.length === 0,
        provider: providerId,
        violations,
        warnings,
        complianceScore,
        agreementStatus,
        lastVerified: agreement.lastVerified,
      };
    },
    [agreements]
  );

  const recordViolation = useCallback(
    async (
      violation: Omit<
        ComplianceViolation,
        "violationId" | "timestamp" | "status"
      >
    ): Promise<string> => {
      const violationId = `violation-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      const fullViolation: ComplianceViolation = {
        violationId,
        timestamp: new Date().toISOString(),
        status: "open",
        ...violation,
      };

      setViolations((prev) => [...prev, fullViolation]);
      return violationId;
    },
    []
  );

  const resolveViolation = useCallback(
    async (violationId: string, resolutionNotes: string): Promise<void> => {
      setViolations((prev) =>
        prev.map((v) =>
          v.violationId === violationId
            ? { ...v, status: "resolved" as const }
            : v
        )
      );
    },
    []
  );

  const updateAgreementVerification = useCallback(
    async (
      providerId: string,
      verificationStatus: ProviderAgreement["verificationStatus"],
      evidence?: string
    ): Promise<void> => {
      setAgreements((prev) =>
        prev.map((a) =>
          a.providerId === providerId
            ? {
                ...a,
                verificationStatus,
                lastVerified: new Date().toISOString(),
              }
            : a
        )
      );
    },
    []
  );

  const generateComplianceReport = useCallback(
    async (startDate: string, endDate: string): Promise<ComplianceReport> => {
      const reportId = `compliance-report-${Date.now()}`;
      const now = new Date().toISOString();

      // Calculate compliance metrics
      const totalProviders = agreements.length;
      const compliantProviders = agreements.filter((a) => {
        const expiryDate = new Date(a.expiryDate);
        return (
          a.verificationStatus === "verified" &&
          a.noTrainingOnCustomerData &&
          a.dataProcessingAgreement &&
          new Date() <= expiryDate
        );
      }).length;

      const complianceScore =
        totalProviders > 0
          ? Math.round((compliantProviders / totalProviders) * 100)
          : 0;
      const overallCompliance: ComplianceReport["overallCompliance"] =
        complianceScore >= 95
          ? "compliant"
          : complianceScore >= 80
          ? "warning"
          : "non_compliant";

      // Filter violations by date range
      const periodViolations = violations.filter((v) => {
        const violationDate = new Date(v.timestamp);
        return (
          violationDate >= new Date(startDate) &&
          violationDate <= new Date(endDate)
        );
      });

      const report: ComplianceReport = {
        reportId,
        generatedAt: now,
        overallCompliance,
        complianceScore,
        providers: agreements.map((a) => ({
          providerId: a.providerId,
          compliant:
            a.verificationStatus === "verified" &&
            a.noTrainingOnCustomerData &&
            new Date() <= new Date(a.expiryDate),
          agreementStatus:
            new Date() > new Date(a.expiryDate)
              ? ("expired" as const)
              : ("active" as const),
          lastVerified: a.lastVerified,
          violations: periodViolations.filter(
            (v) => v.providerId === a.providerId
          ).length,
        })),
        violations: {
          total: periodViolations.length,
          byType: periodViolations.reduce((acc, v) => {
            acc[v.violationType] = (acc[v.violationType] || 0) + 1;
            return acc;
          }, {} as Record<string, number>),
          bySeverity: periodViolations.reduce((acc, v) => {
            acc[v.severity] = (acc[v.severity] || 0) + 1;
            return acc;
          }, {} as Record<string, number>),
          resolved: periodViolations.filter((v) => v.status === "resolved")
            .length,
          pending: periodViolations.filter(
            (v) => v.status === "open" || v.status === "investigating"
          ).length,
        },
        recommendations:
          complianceScore < 100
            ? ["Review and update provider agreements"]
            : [],
        nextActions: [],
      };

      setReport(report);
      return report;
    },
    [agreements, violations]
  );

  // Utility functions
  const getAgreement = useCallback(
    (providerId: string): ProviderAgreement | undefined => {
      return agreements.find((a) => a.providerId === providerId);
    },
    [agreements]
  );

  const isProviderCompliant = useCallback(
    (providerId: string): boolean => {
      const agreement = getAgreement(providerId);
      if (!agreement) return false;

      const now = new Date();
      const expiryDate = new Date(agreement.expiryDate);

      return (
        agreement.verificationStatus === "verified" &&
        agreement.noTrainingOnCustomerData &&
        agreement.dataProcessingAgreement &&
        agreement.gdprCompliant &&
        now <= expiryDate
      );
    },
    [getAgreement]
  );

  const getExpiringAgreements = useCallback(
    (daysThreshold: number = 30): ProviderAgreement[] => {
      const now = new Date();
      return agreements.filter((a) => {
        const expiryDate = new Date(a.expiryDate);
        const daysUntilExpiry =
          (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        return daysUntilExpiry <= daysThreshold && daysUntilExpiry > 0;
      });
    },
    [agreements]
  );

  const getOpenViolations = useCallback((): ComplianceViolation[] => {
    return violations.filter(
      (v) => v.status === "open" || v.status === "investigating"
    );
  }, [violations]);

  return {
    // Data
    agreements,
    violations,
    report,

    // State
    loading,
    error,

    // Actions
    loadComplianceData,
    verifyProviderCompliance,
    recordViolation,
    resolveViolation,
    updateAgreementVerification,
    generateComplianceReport,

    // Utilities
    getAgreement,
    isProviderCompliant,
    getExpiringAgreements,
    getOpenViolations,
  };
};
