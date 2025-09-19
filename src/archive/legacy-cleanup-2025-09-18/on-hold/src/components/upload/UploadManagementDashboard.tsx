/**
 * Upload Management Dashboard
 * User-facing interface for managing file uploads with status tracking
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  Download, 
  Trash2, 
  Eye, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  RefreshCw,
  FileText,
  Image,
  File,
  Search,
  Filter,
  MoreHorizontal
} from 'lucide-react';
import { formatFileSize, formatDistanceToNow } from '@/lib/utils';
import { useUploadManagement } from '@/hooks/useUploadManagement';
import { UploadPreviewModal } from './UploadPreviewModal';
import { UploadAnalytics } from './UploadAnalytics';

export interface UploadRecord {
  id: string;
  filename: string;
  originalFilename: string;
  s3Url: string;
  s3Bucket: string;
  s3Key: string;
  contentType: string;
  fileSize: number;
  uploadType: string;
  status: UploadStatus;
  uploadedAt: string;
  expiresAt?: string;
  metadata?: {
    checksum?: string;
    integrityVerified?: boolean;
    previewUrl?: string;
    thumbnailUrl?: string;
    errorDetails?: string[];
  };
  isPublic: boolean;
  partnerId?: string;
}

export type UploadStatus = 
  | 'pending'
  | 'uploading'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'corrupted'
  | 'quarantined'
  | 'expired';

export interface UploadFilters {
  status?: UploadStatus[];
  uploadType?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  search?: string;
}

export const UploadManagementDashboard: React.FC = () => {
  const [selectedUpload, setSelectedUpload] = useState<UploadRecord | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [filters, setFilters] = useState<UploadFilters>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);

  const {
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
  } = useUploadManagement();

  // Fetch uploads on component mount and when filters change
  useEffect(() => {
    fetchUploads(filters, currentPage, pageSize);
  }, [filters, currentPage, pageSize, fetchUploads]);

  // Auto-refresh every 30 seconds for pending/processing uploads
  useEffect(() => {
    const hasPendingUploads = uploads.some(upload => 
      ['pending', 'uploading', 'processing'].includes(upload.status)
    );

    if (hasPendingUploads) {
      const interval = setInterval(() => {
        fetchUploads(filters, currentPage, pageSize);
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [uploads, filters, currentPage, pageSize, fetchUploads]);

  const handlePreview = useCallback((upload: UploadRecord) => {
    setSelectedUpload(upload);
    setPreviewModalOpen(true);
  }, []);

  const handleDownload = useCallback(async (upload: UploadRecord) => {
    try {
      await downloadUpload(upload.id);
    } catch (error) {
      console.error('Download failed:', error);
    }
  }, [downloadUpload]);

  const handleDelete = useCallback(async (upload: UploadRecord) => {
    if (window.confirm(`Are you sure you want to delete "${upload.filename}"?`)) {
      try {
        await deleteUpload(upload.id);
      } catch (error) {
        console.error('Delete failed:', error);
      }
    }
  }, [deleteUpload]);

  const handleRetry = useCallback(async (upload: UploadRecord) => {
    try {
      await retryUpload(upload.id);
    } catch (error) {
      console.error('Retry failed:', error);
    }
  }, [retryUpload]);

  const getStatusIcon = (status: UploadStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
      case 'corrupted':
      case 'quarantined':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
      case 'uploading':
      case 'processing':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'expired':
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <File className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: UploadStatus) => {
    const variants = {
      completed: 'default',
      failed: 'destructive',
      corrupted: 'destructive',
      quarantined: 'destructive',
      pending: 'secondary',
      uploading: 'secondary',
      processing: 'secondary',
      expired: 'outline',
    } as const;

    return (
      <Badge variant={variants[status] || 'outline'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getFileTypeIcon = (contentType: string) => {
    if (contentType.startsWith('image/')) {
      return <Image className="h-4 w-4 text-blue-500" />;
    } else if (contentType === 'application/pdf') {
      return <FileText className="h-4 w-4 text-red-500" />;
    } else {
      return <File className="h-4 w-4 text-gray-500" />;
    }
  };

  const filteredUploads = uploads.filter(upload => {
    if (filters.status && filters.status.length > 0 && !filters.status.includes(upload.status)) {
      return false;
    }
    if (filters.uploadType && filters.uploadType.length > 0 && !filters.uploadType.includes(upload.uploadType)) {
      return false;
    }
    if (filters.search && !upload.filename.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    return true;
  });

  if (error) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load uploads: {error}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Upload Management</h1>
          <p className="text-muted-foreground">
            Manage your uploaded files and track their status
          </p>
        </div>
        <Button onClick={() => fetchUploads(filters, currentPage, pageSize)} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Upload Statistics */}
      {uploadStats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Uploads</CardTitle>
              <Upload className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{uploadStats.totalUploads}</div>
              <p className="text-xs text-muted-foreground">
                {uploadStats.successRate.toFixed(1)}% success rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
              <File className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatFileSize(uploadStats.totalSize)}</div>
              <p className="text-xs text-muted-foreground">
                Avg: {formatFileSize(uploadStats.averageFileSize)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{uploadStats.thisMonth}</div>
              <p className="text-xs text-muted-foreground">
                {uploadStats.monthlyGrowth > 0 ? '+' : ''}{uploadStats.monthlyGrowth.toFixed(1)}% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed Uploads</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{uploadStats.failedUploads}</div>
              <p className="text-xs text-muted-foreground">
                {uploadStats.failureRate.toFixed(1)}% failure rate
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="uploads" className="space-y-4">
        <TabsList>
          <TabsTrigger value="uploads">My Uploads</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="uploads" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <label className="text-sm font-medium">Search</label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search files..."
                      className="pl-8 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={filters.search || ''}
                      onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="min-w-[150px]">
                  <label className="text-sm font-medium">Status</label>
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={filters.status?.[0] || ''}
                    onChange={(e) => setFilters(prev => ({ 
                      ...prev, 
                      status: e.target.value ? [e.target.value as UploadStatus] : undefined 
                    }))}
                  >
                    <option value="">All Status</option>
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="failed">Failed</option>
                    <option value="corrupted">Corrupted</option>
                  </select>
                </div>

                <div className="min-w-[150px]">
                  <label className="text-sm font-medium">Type</label>
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={filters.uploadType?.[0] || ''}
                    onChange={(e) => setFilters(prev => ({ 
                      ...prev, 
                      uploadType: e.target.value ? [e.target.value] : undefined 
                    }))}
                  >
                    <option value="">All Types</option>
                    <option value="image">Images</option>
                    <option value="document">Documents</option>
                    <option value="report">Reports</option>
                    <option value="avatar">Avatars</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upload List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Uploads ({filteredUploads.length})
              </CardTitle>
              <CardDescription>
                Manage your uploaded files and track their processing status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Loading uploads...</span>
                </div>
              ) : filteredUploads.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Upload className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No uploads found</p>
                  <p className="text-sm">Upload some files to get started</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredUploads.map((upload) => (
                    <div
                      key={upload.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center space-x-4 flex-1">
                        <div className="flex items-center space-x-2">
                          {getFileTypeIcon(upload.contentType)}
                          {getStatusIcon(upload.status)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <p className="font-medium truncate">{upload.filename}</p>
                            {getStatusBadge(upload.status)}
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <span>{formatFileSize(upload.fileSize)}</span>
                            <span>{formatDistanceToNow(new Date(upload.uploadedAt))} ago</span>
                            {upload.uploadType && (
                              <Badge variant="outline" className="text-xs">
                                {upload.uploadType}
                              </Badge>
                            )}
                          </div>
                          {upload.metadata?.errorDetails && (
                            <p className="text-sm text-red-600 mt-1">
                              {upload.metadata.errorDetails[0]}
                            </p>
                          )}
                        </div>

                        {/* Progress bar for uploading files */}
                        {upload.status === 'uploading' && (
                          <div className="w-32">
                            <Progress value={75} className="h-2" />
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        {upload.status === 'completed' && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handlePreview(upload)}
                              disabled={!upload.metadata?.previewUrl}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownload(upload)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </>
                        )}

                        {['failed', 'corrupted'].includes(upload.status) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRetry(upload)}
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(upload)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalCount > pageSize && (
                <div className="flex items-center justify-between mt-6">
                  <p className="text-sm text-muted-foreground">
                    Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} uploads
                  </p>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => prev + 1)}
                      disabled={currentPage * pageSize >= totalCount}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <UploadAnalytics />
        </TabsContent>
      </Tabs>

      {/* Preview Modal */}
      {selectedUpload && (
        <UploadPreviewModal
          upload={selectedUpload}
          open={previewModalOpen}
          onOpenChange={setPreviewModalOpen}
        />
      )}
    </div>
  );
};