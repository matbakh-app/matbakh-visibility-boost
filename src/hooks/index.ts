/**
 * S3 Upload Hooks - Export all S3-related React hooks
 */

// Main upload hook
export { useS3Upload, type UseS3UploadOptions, type UseS3UploadReturn, type UploadQueueItem } from './useS3Upload';

// Avatar management hook
export { useAvatar, type UseAvatarOptions, type UseAvatarReturn, type AvatarUploadOptions } from './useAvatar';

// File preview hook
export { useFilePreview, type UseFilePreviewOptions, type UseFilePreviewReturn, type FilePreviewData } from './useFilePreview';

// Upload history hook
export { useUploadHistory, type UseUploadHistoryOptions, type UseUploadHistoryReturn, type UploadHistoryItem } from './useUploadHistory';

// Secure file access hook
export { useS3FileAccess, type UseS3FileAccessOptions, type UseS3FileAccessReturn, type SecureFileUrlOptions, type SecureFileUrlResult } from './useS3FileAccess';

// Re-export types from the main library for convenience
export type { BucketType, UploadOptions, UploadResult } from '@/lib/s3-upload';