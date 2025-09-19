/**
 * Upload Management Hook
 * Provides functionality for managing file uploads
 */

import { useState, useCallback } from 'react';
import { UploadRecord, UploadStatus, UploadFilters } from '@/components/upload/UploadManagementDashboard';

interface UploadStats {
  totalUploads: number;
  successfulUploads: number;
  failedUploads: number;
  totalSize: number;
  averageFileSize: number;
  successRate: number;
  failureRate: number;
  thisMonth: number;
  monthlyGrowth: number;
}

interface UseUploadManagementReturn {
  uploads: UploadRecord[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  uploadStats: UploadStats | null;
  fetchUploads: (filters?: UploadFilters, page?: number, pageSize?: number) => Promise<void>;
  deleteUpload: (uploadId: string) => Promise<void>;
  downloadUpload: (uploadId: string) => Promise<void>;
  retryUpload: (uploadId: string) => Promise<void>;
  refreshUpload: (uploadId: string) => Promise<void>;
}

export const useUploadManagement = (): UseUploadManagementReturn => {
  const [uploads, setUploads] = useState<UploadRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [uploadStats, setUploadStats] = useState<UploadStats | null>(null);

  const getAuthToken = () => {
    return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
  };

  const fetchUploads = useCallback(async (
    filters: UploadFilters = {},
    page: number = 1,
    pageSize: number = 20
  ) => {
    setLoading(true);
    setError(null);

    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      // Build query parameters
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });

      if (filters.status && filters.status.length > 0) {
        params.append('status', filters.status.join(','));
      }
      if (filters.uploadType && filters.uploadType.length > 0) {
        params.append('uploadType', filters.uploadType.join(','));
      }
      if (filters.search) {
        params.append('search', filters.search);
      }
      if (filters.dateRange) {
        params.append('startDate', filters.dateRange.start);
        params.append('endDate', filters.dateRange.end);
      }

      const response = await fetch(`/api/uploads?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch uploads: ${response.statusText}`);
      }

      const data = await response.json();
      
      setUploads(data.uploads || []);
      setTotalCount(data.totalCount || 0);
      setUploadStats(data.stats || null);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Failed to fetch uploads:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteUpload = useCallback(async (uploadId: string) => {
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`/api/uploads/${uploadId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete upload: ${response.statusText}`);
      }

      // Remove from local state
      setUploads(prev => prev.filter(upload => upload.id !== uploadId));
      setTotalCount(prev => prev - 1);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const downloadUpload = useCallback(async (uploadId: string) => {
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`/api/uploads/${uploadId}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to download upload: ${response.statusText}`);
      }

      const blob = await response.blob();
      const upload = uploads.find(u => u.id === uploadId);
      const filename = upload?.originalFilename || 'download';

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
  }, [uploads]);

  const retryUpload = useCallback(async (uploadId: string) => {
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`/api/uploads/${uploadId}/retry`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to retry upload: ${response.statusText}`);
      }

      // Update local state to show retry in progress
      setUploads(prev => prev.map(upload => 
        upload.id === uploadId 
          ? { ...upload, status: 'pending' as UploadStatus }
          : upload
      ));

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const refreshUpload = useCallback(async (uploadId: string) => {
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`/api/uploads/${uploadId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to refresh upload: ${response.statusText}`);
      }

      const updatedUpload = await response.json();
      
      // Update local state
      setUploads(prev => prev.map(upload => 
        upload.id === uploadId ? updatedUpload : upload
      ));

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      throw err;
    }
  }, []);

  return {
    uploads,
    loading,
    error,
    totalCount,
    uploadStats,
    fetchUploads,
    deleteUpload,
    downloadUpload,
    retryUpload,
    refreshUpload,
  };
};