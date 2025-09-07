/**
 * useS3Upload Hook - React hook for S3 file uploads with state management
 */

import { useState, useCallback, useRef } from 'react';
import {
  uploadToS3Enhanced,
  uploadWithRetryAndRecovery,
  uploadMultipleFiles,
  createUploadController,
  type UploadOptions,
  type UploadResult,
  type BucketType,
} from '@/lib/s3-upload';

export interface UploadQueueItem {
  id: string;
  file: File;
  bucket: BucketType;
  folder?: string;
  status: 'pending' | 'uploading' | 'completed' | 'error' | 'cancelled';
  progress: number;
  result?: UploadResult;
  error?: Error;
  controller?: AbortController;
}

export interface UseS3UploadOptions {
  bucket: BucketType;
  folder?: string;
  maxRetries?: number;
  enableRetry?: boolean;
  onSuccess?: (result: UploadResult) => void;
  onError?: (error: Error) => void;
  onProgress?: (progress: number) => void;
}

export interface UseS3UploadReturn {
  // Single file upload
  upload: (file: File, options?: Partial<UploadOptions>) => Promise<UploadResult>;
  
  // Multiple file upload
  uploadMultiple: (files: File[], options?: Partial<UploadOptions>) => Promise<UploadResult[]>;
  
  // Queue management
  addToQueue: (file: File, options?: Partial<UploadOptions>) => string;
  removeFromQueue: (id: string) => void;
  clearQueue: () => void;
  processQueue: () => Promise<void>;
  cancelUpload: (id?: string) => void; // Cancel specific upload or current upload
  
  // State
  isUploading: boolean;
  progress: number;
  error: Error | null;
  queue: UploadQueueItem[];
  
  // Queue state
  queueProgress: number;
  completedUploads: number;
  failedUploads: number;
}

/**
 * React hook for S3 file uploads with comprehensive state management
 */
export function useS3Upload(options: UseS3UploadOptions): UseS3UploadReturn {
  const {
    bucket,
    folder,
    maxRetries = 3,
    enableRetry = true,
    onSuccess,
    onError,
    onProgress,
  } = options;

  // State
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);
  const [queue, setQueue] = useState<UploadQueueItem[]>([]);

  // Refs for current upload control
  const currentControllerRef = useRef<AbortController | null>(null);
  const queueProcessingRef = useRef(false);

  // Generate unique ID for queue items
  const generateId = useCallback(() => {
    return `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Update progress and call callback
  const updateProgress = useCallback((newProgress: number) => {
    setProgress(newProgress);
    onProgress?.(newProgress);
  }, [onProgress]);

  // Handle upload success
  const handleSuccess = useCallback((result: UploadResult) => {
    setError(null);
    onSuccess?.(result);
  }, [onSuccess]);

  // Handle upload error
  const handleError = useCallback((uploadError: Error) => {
    setError(uploadError);
    onError?.(uploadError);
  }, [onError]);

  // Single file upload
  const upload = useCallback(async (
    file: File,
    uploadOptions?: Partial<UploadOptions>
  ): Promise<UploadResult> => {
    setIsUploading(true);
    setError(null);
    setProgress(0);

    // Create abort controller
    const controller = createUploadController();
    currentControllerRef.current = controller;

    try {
      const uploadConfig: UploadOptions = {
        file,
        bucket,
        folder,
        signal: controller.signal,
        onProgress: updateProgress,
        onSuccess: handleSuccess,
        onError: handleError,
        ...uploadOptions,
      };

      const result = enableRetry
        ? await uploadWithRetryAndRecovery(uploadConfig, maxRetries)
        : await uploadToS3Enhanced(uploadConfig);

      handleSuccess(result);
      return result;

    } catch (uploadError) {
      const error = uploadError instanceof Error ? uploadError : new Error('Upload failed');
      handleError(error);
      throw error;
    } finally {
      setIsUploading(false);
      currentControllerRef.current = null;
    }
  }, [bucket, folder, maxRetries, enableRetry, updateProgress, handleSuccess, handleError]);

  // Multiple file upload
  const uploadMultiple = useCallback(async (
    files: File[],
    uploadOptions?: Partial<UploadOptions>
  ): Promise<UploadResult[]> => {
    setIsUploading(true);
    setError(null);
    setProgress(0);

    // Create abort controller
    const controller = createUploadController();
    currentControllerRef.current = controller;

    try {
      const results = await uploadMultipleFiles(
        files,
        bucket,
        folder,
        (fileIndex, fileProgress) => {
          // Calculate overall progress
          const overallProgress = ((fileIndex * 100) + fileProgress) / files.length;
          updateProgress(overallProgress);
        },
        controller.signal
      );

      handleSuccess(results[results.length - 1]); // Use last result for success callback
      return results;

    } catch (uploadError) {
      const error = uploadError instanceof Error ? uploadError : new Error('Multiple upload failed');
      handleError(error);
      throw error;
    } finally {
      setIsUploading(false);
      currentControllerRef.current = null;
    }
  }, [bucket, folder, updateProgress, handleSuccess, handleError]);

  // Add file to upload queue
  const addToQueue = useCallback((
    file: File,
    uploadOptions?: Partial<UploadOptions>
  ): string => {
    const id = generateId();
    const controller = createUploadController();

    const queueItem: UploadQueueItem = {
      id,
      file,
      bucket: uploadOptions?.bucket || bucket,
      folder: uploadOptions?.folder || folder,
      status: 'pending',
      progress: 0,
      controller,
    };

    setQueue(prev => [...prev, queueItem]);
    return id;
  }, [bucket, folder, generateId]);

  // Remove item from queue
  const removeFromQueue = useCallback((id: string) => {
    setQueue(prev => {
      const item = prev.find(item => item.id === id);
      if (item?.controller && item.status === 'uploading') {
        item.controller.abort();
      }
      return prev.filter(item => item.id !== id);
    });
  }, []);

  // Clear entire queue
  const clearQueue = useCallback(() => {
    // Cancel all uploading items
    queue.forEach(item => {
      if (item.controller && item.status === 'uploading') {
        item.controller.abort();
      }
    });
    setQueue([]);
  }, [queue]);

  // Process upload queue
  const processQueue = useCallback(async () => {
    if (queueProcessingRef.current) {
      return; // Already processing
    }

    queueProcessingRef.current = true;
    setIsUploading(true);
    setError(null);

    try {
      const pendingItems = queue.filter(item => item.status === 'pending');
      
      for (const item of pendingItems) {
        // Update item status to uploading
        setQueue(prev => prev.map(queueItem => 
          queueItem.id === item.id 
            ? { ...queueItem, status: 'uploading' as const }
            : queueItem
        ));

        try {
          const uploadConfig: UploadOptions = {
            file: item.file,
            bucket: item.bucket,
            folder: item.folder,
            signal: item.controller?.signal,
            onProgress: (progress) => {
              setQueue(prev => prev.map(queueItem => 
                queueItem.id === item.id 
                  ? { ...queueItem, progress }
                  : queueItem
              ));
            },
          };

          const result = enableRetry
            ? await uploadWithRetryAndRecovery(uploadConfig, maxRetries)
            : await uploadToS3Enhanced(uploadConfig);

          // Update item with success
          setQueue(prev => prev.map(queueItem => 
            queueItem.id === item.id 
              ? { 
                  ...queueItem, 
                  status: 'completed' as const, 
                  progress: 100, 
                  result 
                }
              : queueItem
          ));

        } catch (uploadError) {
          const error = uploadError instanceof Error ? uploadError : new Error('Upload failed');
          
          // Update item with error
          setQueue(prev => prev.map(queueItem => 
            queueItem.id === item.id 
              ? { 
                  ...queueItem, 
                  status: 'error' as const, 
                  error 
                }
              : queueItem
          ));
        }
      }

    } finally {
      setIsUploading(false);
      queueProcessingRef.current = false;
    }
  }, [queue, bucket, folder, maxRetries, enableRetry]);

  // Cancel upload
  const cancelUpload = useCallback((id?: string) => {
    if (id) {
      // Cancel specific upload in queue
      setQueue(prev => prev.map(item => {
        if (item.id === id && item.controller) {
          item.controller.abort();
          return { ...item, status: 'cancelled' as const };
        }
        return item;
      }));
    } else {
      // Cancel current upload
      if (currentControllerRef.current) {
        currentControllerRef.current.abort();
      }
    }
  }, []);

  // Calculate queue statistics
  const queueStats = queue.reduce(
    (stats, item) => {
      if (item.status === 'completed') {
        stats.completed++;
        stats.totalProgress += 100;
      } else if (item.status === 'error' || item.status === 'cancelled') {
        stats.failed++;
      } else if (item.status === 'uploading') {
        stats.totalProgress += item.progress;
      }
      return stats;
    },
    { completed: 0, failed: 0, totalProgress: 0 }
  );

  const queueProgress = queue.length > 0 ? queueStats.totalProgress / queue.length : 0;

  return {
    // Methods
    upload,
    uploadMultiple,
    addToQueue,
    removeFromQueue,
    clearQueue,
    processQueue,
    cancelUpload,

    // State
    isUploading,
    progress,
    error,
    queue,

    // Queue statistics
    queueProgress,
    completedUploads: queueStats.completed,
    failedUploads: queueStats.failed,
  };
}

export default useS3Upload;