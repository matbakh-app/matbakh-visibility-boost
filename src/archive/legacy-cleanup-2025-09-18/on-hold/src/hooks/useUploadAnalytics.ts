/**
 * Upload Analytics Hook
 * Provides analytics data and export functionality for uploads
 */

import { useState, useCallback, useEffect } from 'react';

interface AnalyticsData {
  uploadTrends: Array<{
    date: string;
    uploads: number;
    successful: number;
    failed: number;
    totalSize: number;
  }>;
  fileTypeDistribution: Array<{
    type: string;
    count: number;
    size: number;
    percentage: number;
    color: string;
  }>;
  statusDistribution: Array<{
    status: string;
    count: number;
    percentage: number;
    color: string;
  }>;
  performanceMetrics: {
    averageUploadTime: number;
    successRate: number;
    failureRate: number;
    retryRate: number;
    integrityCheckRate: number;
  };
  storageUsage: {
    totalUsed: number;
    totalQuota: number;
    byType: Array<{
      type: string;
      size: number;
      percentage: number;
    }>;
  };
  topErrors: Array<{
    error: string;
    count: number;
    percentage: number;
  }>;
}

interface UseUploadAnalyticsReturn {
  analyticsData: AnalyticsData | null;
  loading: boolean;
  error: string | null;
  exportData: (format: 'csv' | 'pdf', timeRange: string) => Promise<void>;
  refreshAnalytics: () => Promise<void>;
}

export const useUploadAnalytics = (timeRange: string): UseUploadAnalyticsReturn => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAuthToken = () => {
    return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
  };

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`/api/uploads/analytics?timeRange=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch analytics: ${response.statusText}`);
      }

      const data = await response.json();
      setAnalyticsData(data);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Failed to fetch analytics:', err);
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  const exportData = useCallback(async (format: 'csv' | 'pdf', exportTimeRange: string) => {
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`/api/uploads/analytics/export`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          format,
          timeRange: exportTimeRange,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to export data: ${response.statusText}`);
      }

      const blob = await response.blob();
      const filename = `upload-analytics-${exportTimeRange}.${format}`;

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const refreshAnalytics = useCallback(async () => {
    await fetchAnalytics();
  }, [fetchAnalytics]);

  // Fetch analytics when timeRange changes
  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    analyticsData,
    loading,
    error,
    exportData,
    refreshAnalytics,
  };
};