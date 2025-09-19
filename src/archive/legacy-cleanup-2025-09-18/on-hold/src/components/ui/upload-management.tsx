/**
 * Upload Management Components - Advanced upload progress, file preview, and history management
 */

import React, { useState, useCallback, useMemo } from 'react';
import { 
  X, Upload, CheckCircle, AlertCircle, FileText, Image, File, 
  Download, Eye, Trash2, RefreshCw, Clock, Calendar, Filter,
  Search, ChevronDown, ChevronUp, MoreHorizontal, Copy, ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { formatFileSize } from '@/lib/s3-upload';
import { UploadProgress, FilePreview, MultipleUploadProgress } from '@/components/ui/upload-progress';

// Enhanced Upload Progress with Cancel Option
export interface EnhancedUploadProgressProps {
  fileName: string;
  fileSize: number;
  progress: number;
  status: 'uploading' | 'completed' | 'error' | 'cancelled' | 'paused';
  error?: string;
  onCancel?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onRetry?: () => void;
  showCancel?: boolean;
  showPause?: boolean;
  estimatedTimeRemaining?: number;
  uploadSpeed?: number; // bytes per second
}

export const EnhancedUploadProgress: React.FC<EnhancedUploadProgressProps> = ({
  fileName,
  fileSize,
  progress,
  status,
  error,
  onCancel,
  onPause,
  onResume,
  onRetry,
  showCancel = true,
  showPause = true,
  estimatedTimeRemaining,
  uploadSpeed,
}) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'uploading':
        return <Upload className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'cancelled':
        return <X className="h-4 w-4 text-gray-500" />;
      case 'paused':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Upload className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'uploading':
        return `Uploading... ${Math.round(progress)}%`;
      case 'completed':
        return 'Upload completed';
      case 'error':
        return error || 'Upload failed';
      case 'cancelled':
        return 'Upload cancelled';
      case 'paused':
        return `Paused at ${Math.round(progress)}%`;
      default:
        return 'Preparing upload...';
    }
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${Math.round(seconds / 3600)}h`;
  };

  const formatSpeed = (bytesPerSecond: number) => {
    if (bytesPerSecond < 1024) return `${Math.round(bytesPerSecond)} B/s`;
    if (bytesPerSecond < 1024 * 1024) return `${Math.round(bytesPerSecond / 1024)} KB/s`;
    return `${Math.round(bytesPerSecond / (1024 * 1024))} MB/s`;
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          {getStatusIcon()}
          <span className="text-sm font-medium text-gray-900 truncate">
            {fileName}
          </span>
        </div>
        
        <div className="flex items-center space-x-1">
          {status === 'uploading' && showPause && onPause && (
            <Button variant="ghost" size="sm" onClick={onPause} title="Pause upload">
              <Clock className="h-4 w-4" />
            </Button>
          )}
          
          {status === 'paused' && onResume && (
            <Button variant="ghost" size="sm" onClick={onResume} title="Resume upload">
              <Upload className="h-4 w-4" />
            </Button>
          )}
          
          {status === 'error' && onRetry && (
            <Button variant="ghost" size="sm" onClick={onRetry} title="Retry upload">
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
          
          {showCancel && (status === 'uploading' || status === 'paused') && onCancel && (
            <Button variant="ghost" size="sm" onClick={onCancel} title="Cancel upload">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs text-gray-500">
          <span>{getStatusText()}</span>
          <span>{formatFileSize(fileSize)}</span>
        </div>
        
        <Progress 
          value={Math.min(progress, 100)} 
          className="h-2"
        />
        
        {(status === 'uploading' || status === 'paused') && (
          <div className="flex justify-between text-xs text-gray-500">
            <span>
              {uploadSpeed && `${formatSpeed(uploadSpeed)}`}
            </span>
            <span>
              {estimatedTimeRemaining && `${formatTime(estimatedTimeRemaining)} remaining`}
            </span>
          </div>
        )}
      </div>

      {error && status === 'error' && (
        <div className="text-xs text-red-600 mt-2 p-2 bg-red-50 rounded">
          {error}
        </div>
      )}
    </Card>
  );
};

// Enhanced File Preview Component
export interface EnhancedFilePreviewProps {
  file: File | { name: string; size: number; type: string; url: string };
  preview?: string;
  onRemove?: () => void;
  onView?: () => void;
  onDownload?: () => void;
  className?: string;
  showActions?: boolean;
  uploadDate?: Date;
  status?: 'uploading' | 'completed' | 'error';
}

export const EnhancedFilePreview: React.FC<EnhancedFilePreviewProps> = ({ 
  file, 
  preview, 
  onRemove, 
  onView,
  onDownload,
  className = '',
  showActions = true,
  uploadDate,
  status = 'completed'
}) => {
  const isImage = file.type.startsWith('image/');
  const isPDF = file.type.includes('pdf');
  const isDocument = file.type.includes('document') || file.type.includes('text');

  const getFileIcon = () => {
    if (isImage) return <Image className="h-6 w-6 text-blue-500" />;
    if (isPDF) return <FileText className="h-6 w-6 text-red-500" />;
    if (isDocument) return <FileText className="h-6 w-6 text-green-500" />;
    return <File className="h-6 w-6 text-gray-500" />;
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'uploading':
        return <Badge variant="secondary">Uploading</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card className={`group hover:shadow-md transition-shadow ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          {/* File preview/icon */}
          <div className="flex-shrink-0">
            {preview && isImage ? (
              <div className="relative">
                <img
                  src={preview}
                  alt={file.name}
                  className="h-16 w-16 object-cover rounded cursor-pointer"
                  onClick={onView}
                />
                {onView && (
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded flex items-center justify-center transition-all">
                    <Eye className="h-4 w-4 text-white opacity-0 group-hover:opacity-100" />
                  </div>
                )}
              </div>
            ) : (
              <div className="h-16 w-16 bg-gray-100 rounded flex items-center justify-center">
                {getFileIcon()}
              </div>
            )}
          </div>

          {/* File info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <p className="text-sm font-medium text-gray-900 truncate" title={file.name}>
                {file.name}
              </p>
              {getStatusBadge()}
            </div>
            
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              <span>{formatFileSize(file.size)}</span>
              <span>{file.type.split('/')[1]?.toUpperCase()}</span>
              {uploadDate && (
                <span>{uploadDate.toLocaleDateString()}</span>
              )}
            </div>
          </div>

          {/* Actions */}
          {showActions && (
            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {onView && (
                <Button variant="ghost" size="sm" onClick={onView} title="View file">
                  <Eye className="h-4 w-4" />
                </Button>
              )}
              
              {onDownload && (
                <Button variant="ghost" size="sm" onClick={onDownload} title="Download file">
                  <Download className="h-4 w-4" />
                </Button>
              )}
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => navigator.clipboard.writeText(file.name)}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy name
                  </DropdownMenuItem>
                  {'url' in file && (
                    <DropdownMenuItem onClick={() => window.open(file.url, '_blank')}>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open in new tab
                    </DropdownMenuItem>
                  )}
                  {onRemove && (
                    <DropdownMenuItem onClick={onRemove} className="text-red-600">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Upload History Component
export interface UploadHistoryItem {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  fileUrl: string;
  uploadDate: Date;
  status: 'completed' | 'error' | 'deleted';
  bucket: string;
  folder?: string;
  error?: string;
}

export interface UploadHistoryProps {
  uploads: UploadHistoryItem[];
  onDownload?: (item: UploadHistoryItem) => void;
  onDelete?: (item: UploadHistoryItem) => void;
  onView?: (item: UploadHistoryItem) => void;
  className?: string;
  showFilters?: boolean;
  maxItems?: number;
}

export const UploadHistory: React.FC<UploadHistoryProps> = ({
  uploads,
  onDownload,
  onDelete,
  onView,
  className = '',
  showFilters = true,
  maxItems = 50,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'size'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isExpanded, setIsExpanded] = useState(true);

  // Filter and sort uploads
  const filteredUploads = useMemo(() => {
    const filtered = uploads
      .filter(upload => {
        const matchesSearch = upload.fileName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || upload.status === statusFilter;
        const matchesType = typeFilter === 'all' || upload.fileType.startsWith(typeFilter);
        
        return matchesSearch && matchesStatus && matchesType;
      })
      .slice() // Create defensive copy
      .sort((a, b) => {
        let comparison = 0;
        
        switch (sortBy) {
          case 'date':
            comparison = a.uploadDate.getTime() - b.uploadDate.getTime();
            break;
          case 'name':
            comparison = a.fileName.localeCompare(b.fileName);
            break;
          case 'size':
            comparison = a.fileSize - b.fileSize;
            break;
        }
        
        return sortOrder === 'desc' ? -comparison : comparison;
      });

    return filtered.slice(0, maxItems);
  }, [uploads, searchTerm, statusFilter, typeFilter, sortBy, sortOrder, maxItems]);

  // Get unique file types for filter
  const fileTypes = useMemo(() => {
    const types = new Set(uploads.map(upload => upload.fileType.split('/')[0]));
    return Array.from(types);
  }, [uploads]);

  // Statistics
  const stats = useMemo(() => {
    const total = uploads.length;
    const completed = uploads.filter(u => u.status === 'completed').length;
    const errors = uploads.filter(u => u.status === 'error').length;
    const totalSize = uploads.reduce((sum, u) => sum + u.fileSize, 0);
    
    return { total, completed, errors, totalSize };
  }, [uploads]);

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Upload className="h-5 w-5" />
            <span>Upload History</span>
            <Badge variant="secondary">{stats.total}</Badge>
          </CardTitle>
          
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm">
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
          </Collapsible>
        </div>

        {/* Statistics */}
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <span>{stats.completed} completed</span>
          {stats.errors > 0 && <span className="text-red-600">{stats.errors} failed</span>}
          <span>{formatFileSize(stats.totalSize)} total</span>
        </div>
      </CardHeader>

      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleContent>
          <CardContent className="space-y-4">
            {/* Filters */}
            {showFilters && (
              <div className="flex flex-wrap items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex-1 min-w-48">
                  <Input
                    placeholder="Search files..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-8"
                  />
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="error">Failed</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-32 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {fileTypes.map(type => (
                      <SelectItem key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
                  const [sort, order] = value.split('-') as [typeof sortBy, typeof sortOrder];
                  setSortBy(sort);
                  setSortOrder(order);
                }}>
                  <SelectTrigger className="w-40 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date-desc">Newest first</SelectItem>
                    <SelectItem value="date-asc">Oldest first</SelectItem>
                    <SelectItem value="name-asc">Name A-Z</SelectItem>
                    <SelectItem value="name-desc">Name Z-A</SelectItem>
                    <SelectItem value="size-desc">Largest first</SelectItem>
                    <SelectItem value="size-asc">Smallest first</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Upload list */}
            {filteredUploads.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' 
                  ? 'No uploads match your filters' 
                  : 'No uploads yet'
                }
              </div>
            ) : (
              <div className="space-y-2">
                {filteredUploads.map((upload) => (
                  <EnhancedFilePreview
                    key={upload.id}
                    file={{
                      name: upload.fileName,
                      size: upload.fileSize,
                      type: upload.fileType,
                      url: upload.fileUrl,
                    }}
                    uploadDate={upload.uploadDate}
                    status={upload.status}
                    onView={() => onView?.(upload)}
                    onDownload={() => onDownload?.(upload)}
                    onRemove={() => onDelete?.(upload)}
                    showActions={true}
                  />
                ))}
              </div>
            )}

            {filteredUploads.length >= maxItems && (
              <div className="text-center text-sm text-gray-500 pt-4">
                Showing first {maxItems} results
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

// Bulk Upload Management Interface
export interface BulkUploadItem {
  id: string;
  file: File;
  status: 'pending' | 'uploading' | 'completed' | 'error' | 'cancelled';
  progress: number;
  error?: string;
  result?: any;
}

export interface BulkUploadManagerProps {
  uploads: BulkUploadItem[];
  onCancelUpload?: (id: string) => void;
  onRetryUpload?: (id: string) => void;
  onRemoveUpload?: (id: string) => void;
  onCancelAll?: () => void;
  onRetryAll?: () => void;
  onClearCompleted?: () => void;
  className?: string;
}

export const BulkUploadManager: React.FC<BulkUploadManagerProps> = ({
  uploads,
  onCancelUpload,
  onRetryUpload,
  onRemoveUpload,
  onCancelAll,
  onRetryAll,
  onClearCompleted,
  className = '',
}) => {
  const stats = useMemo(() => {
    const total = uploads.length;
    const pending = uploads.filter(u => u.status === 'pending').length;
    const uploading = uploads.filter(u => u.status === 'uploading').length;
    const completed = uploads.filter(u => u.status === 'completed').length;
    const failed = uploads.filter(u => u.status === 'error').length;
    const cancelled = uploads.filter(u => u.status === 'cancelled').length;
    
    const overallProgress = total > 0 
      ? uploads.reduce((sum, upload) => sum + upload.progress, 0) / total 
      : 0;

    return { total, pending, uploading, completed, failed, cancelled, overallProgress };
  }, [uploads]);

  if (uploads.length === 0) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Upload className="h-5 w-5" />
            <span>Bulk Upload Manager</span>
            <Badge variant="secondary">{stats.total}</Badge>
          </CardTitle>
          
          <div className="flex items-center space-x-2">
            {stats.failed > 0 && onRetryAll && (
              <Button variant="outline" size="sm" onClick={onRetryAll}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry Failed
              </Button>
            )}
            
            {stats.completed > 0 && onClearCompleted && (
              <Button variant="outline" size="sm" onClick={onClearCompleted}>
                <Trash2 className="h-4 w-4 mr-2" />
                Clear Completed
              </Button>
            )}
            
            {(stats.uploading > 0 || stats.pending > 0) && onCancelAll && (
              <Button variant="outline" size="sm" onClick={onCancelAll}>
                <X className="h-4 w-4 mr-2" />
                Cancel All
              </Button>
            )}
          </div>
        </div>

        {/* Overall progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>
              {stats.completed} completed, {stats.failed} failed, {stats.uploading} uploading, {stats.pending} pending
            </span>
            <span>{Math.round(stats.overallProgress)}%</span>
          </div>
          <Progress value={stats.overallProgress} className="h-2" />
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {uploads.map((upload) => (
            <EnhancedUploadProgress
              key={upload.id}
              fileName={upload.file.name}
              fileSize={upload.file.size}
              progress={upload.progress}
              status={upload.status}
              error={upload.error}
              onCancel={() => onCancelUpload?.(upload.id)}
              onRetry={() => onRetryUpload?.(upload.id)}
              showCancel={upload.status === 'uploading' || upload.status === 'pending'}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default {
  EnhancedUploadProgress,
  EnhancedFilePreview,
  UploadHistory,
  BulkUploadManager,
};