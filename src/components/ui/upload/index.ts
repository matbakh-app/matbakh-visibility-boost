/**
 * S3 Upload Components - Export all upload-related components
 */

// Main upload components
export { ImageUpload, type ImageUploadProps } from '../image-upload';
export { FileInput, type FileInputProps } from '../file-input';

// Upload progress components
export {
  UploadProgress,
  FilePreview,
  MultipleUploadProgress,
  type UploadProgressProps,
  type FilePreviewProps,
  type MultipleUploadProgressProps
} from '../upload-progress';

// Advanced upload management components
export {
  EnhancedUploadProgress,
  EnhancedFilePreview,
  UploadHistory,
  BulkUploadManager,
  type EnhancedUploadProgressProps,
  type EnhancedFilePreviewProps,
  type UploadHistoryProps,
  type UploadHistoryItem,
  type BulkUploadManagerProps,
  type BulkUploadItem,
} from '../upload-management';

// File preview modal
export {
  FilePreviewModal,
  type FilePreviewModalProps,
  type FilePreviewItem,
} from '../file-preview-modal';

// Re-export hooks for convenience
export { useS3Upload, type UseS3UploadOptions, type UseS3UploadReturn } from '@/hooks/useS3Upload';
export { useAvatar } from '@/hooks/useAvatar';
export { useFilePreview } from '@/hooks/useFilePreview';
export { useUploadHistory } from '@/hooks/useUploadHistory';
export { useS3FileAccess } from '@/hooks/useS3FileAccess';

// Re-export utilities
export {
  uploadToS3Enhanced,
  uploadWithCompression,
  uploadWithRetry,
  uploadWithRetryAndRecovery,
  uploadMultipleFiles,
  validateFile,
  generateFilePreview,
  formatFileSize,
  compressImage,
  createUploadController,
  type UploadOptions,
  type UploadResult,
  type BucketType,
} from '@/lib/s3-upload';