/**
 * Upload Progress UI Components
 */

import React from 'react';
import { X, Upload, CheckCircle, AlertCircle, FileText, Image } from 'lucide-react';
import { formatFileSize } from '@/lib/s3-upload';

export interface UploadProgressProps {
  fileName: string;
  fileSize: number;
  progress: number;
  status: 'uploading' | 'completed' | 'error' | 'cancelled';
  error?: string;
  onCancel?: () => void;
  showCancel?: boolean;
}

export const UploadProgress = React.memo(function UploadProgress({
  fileName,
  fileSize,
  progress,
  status,
  error,
  onCancel,
  showCancel = true,
}: UploadProgressProps) {
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
      default:
        return 'Preparing upload...';
    }
  };

  const getProgressBarColor = () => {
    switch (status) {
      case 'uploading':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      case 'cancelled':
        return 'bg-gray-500';
      default:
        return 'bg-gray-300';
    }
  };

  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <span className="text-sm font-medium text-gray-900 truncate">
            {fileName}
          </span>
        </div>
        {showCancel && status === 'uploading' && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 rounded"
            title="Cancel upload"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="mb-2">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>{getStatusText()}</span>
          <span>{formatFileSize(fileSize)}</span>
        </div>
        
        <div
          className="w-full bg-gray-200 rounded-full h-2"
          role="progressbar"
          aria-valuenow={Math.round(Math.min(progress, 100))}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Upload progress for ${fileName}`}
        >
          <div
            className={`h-2 rounded-full transition-all duration-300 motion-reduce:transition-none ${getProgressBarColor()}`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <p className="sr-only" aria-live="polite">
          {getStatusText()} – {formatFileSize(fileSize)}
        </p>
      </div>

      {error && status === 'error' && (
        <div className="text-xs text-red-600 mt-1">
          {error}
        </div>
      )}
    </div>
  );
});

export interface FilePreviewProps {
  file: File;
  preview?: string;
  onRemove?: () => void;
  className?: string;
}

export const FilePreview = React.memo(function FilePreview({ file, preview, onRemove, className = '' }: FilePreviewProps) {
  const isImage = file.type.startsWith('image/');

  return (
    <div className={`relative group border rounded-lg p-2 bg-gray-50 ${className}`}>
      {onRemove && (
        <button
          onClick={onRemove}
          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
          title="Remove file"
        >
          <X className="h-3 w-3" />
        </button>
      )}

      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0">
          {preview && isImage ? (
            <img
              src={preview}
              alt={file.name}
              className="h-12 w-12 object-cover rounded"
            />
          ) : (
            <div className="h-12 w-12 bg-gray-200 rounded flex items-center justify-center">
              {isImage ? (
                <Image className="h-6 w-6 text-gray-400" />
              ) : (
                <FileText className="h-6 w-6 text-gray-400" />
              )}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {file.name}
          </p>
          <p className="text-xs text-gray-500">
            {formatFileSize(file.size)} • {(file.type || 'application/octet-stream')}
          </p>
        </div>
      </div>
    </div>
  );
});

export interface MultipleUploadProgressProps {
  uploads: Array<{
    id: string;
    file: File;
    progress: number;
    status: 'uploading' | 'completed' | 'error' | 'cancelled';
    error?: string;
  }>;
  onCancelUpload?: (id: string) => void;
  onCancelAll?: () => void;
  className?: string;
}

export function MultipleUploadProgress({
  uploads,
  onCancelUpload,
  onCancelAll,
  className = '',
}: MultipleUploadProgressProps) {
  const { totalFiles, completedFiles, failedFiles, uploadingFiles, overallProgress } = React.useMemo(() => {
    const total = uploads.length;
    let completed = 0, failed = 0, uploading = 0, sum = 0;
    for (const u of uploads) {
      sum += u.progress || 0;
      if (u.status === 'completed') completed++;
      else if (u.status === 'error') failed++;
      else if (u.status === 'uploading') uploading++;
    }
    return {
      totalFiles: total,
      completedFiles: completed,
      failedFiles: failed,
      uploadingFiles: uploading,
      overallProgress: total > 0 ? sum / total : 0,
    };
  }, [uploads]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Overall progress */}
      <div className="bg-white border rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-900">
            Uploading {totalFiles} files
          </h3>
          {onCancelAll && uploadingFiles > 0 && (
            <button
              onClick={onCancelAll}
              className="text-sm text-red-600 hover:text-red-800 transition-colors"
            >
              Cancel All
            </button>
          )}
        </div>

        <div className="mb-2">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>
              {completedFiles} completed, {failedFiles} failed, {uploadingFiles} uploading
            </span>
            <span>{Math.round(overallProgress)}%</span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="h-2 bg-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(overallProgress, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Individual file progress */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {uploads.map((upload) => (
          <UploadProgress
            key={upload.id}
            fileName={upload.file.name}
            fileSize={upload.file.size}
            progress={upload.progress}
            status={upload.status}
            error={upload.error}
            onCancel={() => onCancelUpload?.(upload.id)}
            showCancel={upload.status === 'uploading'}
          />
        ))}
      </div>
    </div>
  );
}