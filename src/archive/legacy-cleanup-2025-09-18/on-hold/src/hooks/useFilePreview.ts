/**
 * useFilePreview Hook - React hook for file preview generation and management
 */

import { useState, useCallback, useEffect } from 'react';
import { generateFilePreview, formatFileSize } from '@/lib/s3-upload';

export interface FilePreviewData {
  type: 'image' | 'document' | 'unknown';
  preview?: string; // Data URL for images
  metadata: {
    name: string;
    size: string;
    type: string;
    lastModified: string;
  };
}

export interface UseFilePreviewOptions {
  autoGenerate?: boolean; // Auto-generate preview when file changes
  maxPreviewSize?: number; // Max file size for preview generation (bytes)
  supportedTypes?: string[]; // Supported file types for preview
}

export interface UseFilePreviewReturn {
  // Preview data
  previewData: FilePreviewData | null;
  isGenerating: boolean;
  error: Error | null;

  // Methods
  generatePreview: (file: File) => Promise<FilePreviewData>;
  clearPreview: () => void;
  
  // Utility methods
  isPreviewSupported: (file: File) => boolean;
  getPreviewUrl: () => string | null;
  downloadPreview: (filename?: string) => void;
}

const DEFAULT_OPTIONS: Required<UseFilePreviewOptions> = {
  autoGenerate: true,
  maxPreviewSize: 10 * 1024 * 1024, // 10MB
  supportedTypes: [
    // Images
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/avif',
    // Documents
    'application/pdf', 'text/plain', 'text/csv', 'application/json',
    // Office documents (limited preview support)
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
};

/**
 * React hook for file preview generation and management
 */
export function useFilePreview(options: UseFilePreviewOptions = {}): UseFilePreviewReturn {
  const config = { ...DEFAULT_OPTIONS, ...options };

  // State
  const [previewData, setPreviewData] = useState<FilePreviewData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Check if preview is supported for file type
  const isPreviewSupported = useCallback((file: File): boolean => {
    return config.supportedTypes.includes(file.type) && file.size <= config.maxPreviewSize;
  }, [config.supportedTypes, config.maxPreviewSize]);

  // Generate preview for file
  const generatePreview = useCallback(async (file: File): Promise<FilePreviewData> => {
    setIsGenerating(true);
    setError(null);

    try {
      // Check if preview is supported
      if (!isPreviewSupported(file)) {
        throw new Error(`Preview not supported for file type: ${file.type}`);
      }

      // Generate preview using the library function
      const preview = await generateFilePreview(file);
      setPreviewData(preview);
      return preview;

    } catch (previewError) {
      const error = previewError instanceof Error ? previewError : new Error('Preview generation failed');
      setError(error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  }, [isPreviewSupported]);

  // Clear preview data
  const clearPreview = useCallback(() => {
    // Clean up blob URLs to prevent memory leaks
    if (previewData?.preview && previewData.preview.startsWith('blob:')) {
      URL.revokeObjectURL(previewData.preview);
    }
    
    setPreviewData(null);
    setError(null);
  }, [previewData]);

  // Get preview URL (for images)
  const getPreviewUrl = useCallback((): string | null => {
    return previewData?.preview || null;
  }, [previewData]);

  // Download preview as file
  const downloadPreview = useCallback((filename?: string) => {
    if (!previewData?.preview) {
      console.warn('No preview available for download');
      return;
    }

    try {
      const link = document.createElement('a');
      link.href = previewData.preview;
      link.download = filename || previewData.metadata.name || 'preview';
      
      // Append to body, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (downloadError) {
      console.error('Failed to download preview:', downloadError);
      setError(new Error('Failed to download preview'));
    }
  }, [previewData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (previewData?.preview && previewData.preview.startsWith('blob:')) {
        URL.revokeObjectURL(previewData.preview);
      }
    };
  }, [previewData]);

  return {
    // State
    previewData,
    isGenerating,
    error,

    // Methods
    generatePreview,
    clearPreview,
    isPreviewSupported,
    getPreviewUrl,
    downloadPreview,
  };
}

export default useFilePreview;