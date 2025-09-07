/**
 * useAvatar Hook - React hook for avatar-specific upload and management
 */

import { useState, useCallback, useEffect } from 'react';
import {
  uploadWithCompression,
  compressImage,
  validateFile,
  type UploadResult,
  type BucketType,
} from '@/lib/s3-upload';

export interface AvatarUploadOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'image/jpeg' | 'image/png' | 'image/webp';
  enableCompression?: boolean;
}

export interface UseAvatarOptions {
  userId?: string;
  partnerId?: string;
  bucket?: BucketType;
  folder?: string;
  fallbackUrl?: string;
  onSuccess?: (avatarUrl: string) => void;
  onError?: (error: Error) => void;
}

export interface UseAvatarReturn {
  // Avatar URL and state
  avatarUrl: string | null;
  isLoading: boolean;
  isUploading: boolean;
  uploadProgress: number;
  error: Error | null;

  // Methods
  uploadAvatar: (file: File, options?: AvatarUploadOptions) => Promise<string>;
  deleteAvatar: () => Promise<void>;
  refreshAvatar: () => Promise<void>;

  // Preview functionality
  previewUrl: string | null;
  setPreviewFromFile: (file: File) => Promise<void>;
  clearPreview: () => void;
}

// Default avatar compression settings optimized for avatars
const DEFAULT_AVATAR_OPTIONS: Required<AvatarUploadOptions> = {
  maxWidth: 400,
  maxHeight: 400,
  quality: 0.85,
  format: 'image/jpeg',
  enableCompression: true,
};

// Fallback avatar URLs
const FALLBACK_AVATARS = {
  user: '/images/default-user-avatar.svg',
  partner: '/images/default-partner-avatar.svg',
  generic: '/images/default-avatar.svg',
};

/**
 * React hook for avatar upload and management with image optimization
 */
export function useAvatar(options: UseAvatarOptions = {}): UseAvatarReturn {
  const {
    userId,
    partnerId,
    bucket = 'matbakh-files-profile',
    folder = 'avatars',
    fallbackUrl,
    onSuccess,
    onError,
  } = options;

  // State
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Get entity ID (userId or partnerId)
  const entityId = userId || partnerId;
  const entityType = userId ? 'user' : partnerId ? 'partner' : 'generic';

  // Generate avatar folder path
  const getAvatarFolder = useCallback(() => {
    if (!entityId) return folder;
    return `${folder}/${entityId}`;
  }, [folder, entityId]);

  // Generate avatar filename
  const getAvatarFilename = useCallback((originalName: string, format: string) => {
    const timestamp = Date.now();
    const extension = format.split('/')[1] || 'jpg';
    return `avatar_${timestamp}.${extension}`;
  }, []);

  // Get fallback avatar URL
  const getFallbackUrl = useCallback(() => {
    if (fallbackUrl) return fallbackUrl;
    return FALLBACK_AVATARS[entityType] || FALLBACK_AVATARS.generic;
  }, [fallbackUrl, entityType]);

  // Load current avatar URL
  const loadAvatarUrl = useCallback(async () => {
    if (!entityId) {
      setAvatarUrl(getFallbackUrl());
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Try to fetch current avatar from API/database
      const API_BASE_URL = import.meta.env.VITE_PUBLIC_API_BASE || 'https://api.matbakh.app';
      const authToken = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const response = await fetch(`${API_BASE_URL}/avatar/${entityType}/${entityId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAvatarUrl(data.avatarUrl || getFallbackUrl());
      } else {
        setAvatarUrl(getFallbackUrl());
      }
    } catch (loadError) {
      console.warn('Failed to load avatar URL:', loadError);
      setAvatarUrl(getFallbackUrl());
    } finally {
      setIsLoading(false);
    }
  }, [entityId, entityType, getFallbackUrl]);

  // Load avatar on mount and when entityId changes
  useEffect(() => {
    loadAvatarUrl();
  }, [loadAvatarUrl]);

  // Validate avatar file
  const validateAvatarFile = useCallback((file: File): { valid: boolean; error?: string } => {
    // Use base validation first
    const baseValidation = validateFile(file, 5 * 1024 * 1024); // 5MB max for avatars
    if (!baseValidation.valid) {
      return baseValidation;
    }

    // Avatar-specific validations
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Avatar must be a JPEG, PNG, WebP, or GIF image',
      };
    }

    // Check image dimensions (if possible)
    return { valid: true };
  }, []);

  // Resize and optimize avatar image
  const optimizeAvatarImage = useCallback(async (
    file: File,
    options: AvatarUploadOptions = {}
  ): Promise<File> => {
    const config = { ...DEFAULT_AVATAR_OPTIONS, ...options };

    if (!config.enableCompression) {
      return file;
    }

    try {
      // Compress image with avatar-specific settings
      const optimizedFile = await compressImage(file, {
        maxWidth: config.maxWidth,
        maxHeight: config.maxHeight,
        quality: config.quality,
        format: config.format,
      });

      console.log(`Avatar optimized: ${file.size} → ${optimizedFile.size} bytes`);
      return optimizedFile;

    } catch (compressionError) {
      console.warn('Avatar optimization failed, using original:', compressionError);
      return file;
    }
  }, []);

  // Upload avatar
  const uploadAvatar = useCallback(async (
    file: File,
    uploadOptions: AvatarUploadOptions = {}
  ): Promise<string> => {
    if (!entityId) {
      throw new Error('User ID or Partner ID is required for avatar upload');
    }

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      // Validate avatar file
      const validation = validateAvatarFile(file);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      setUploadProgress(10);

      // Optimize image
      const optimizedFile = await optimizeAvatarImage(file, uploadOptions);
      setUploadProgress(20);

      // Generate filename and folder
      const filename = getAvatarFilename(file.name, optimizedFile.type);
      const avatarFolder = getAvatarFolder();

      // Upload to S3
      const result = await uploadWithCompression({
        file: optimizedFile,
        bucket,
        folder: avatarFolder,
        compressImages: false, // Already optimized
        onProgress: (progress) => {
          // Map to 20-90% range
          const mappedProgress = 20 + (progress * 0.7);
          setUploadProgress(mappedProgress);
        },
      });

      setUploadProgress(95);

      // Update avatar URL in database
      await updateAvatarInDatabase(result.fileUrl);

      setUploadProgress(100);

      // Update local state
      setAvatarUrl(result.cdnUrl || result.fileUrl);

      onSuccess?.(result.cdnUrl || result.fileUrl);
      return result.cdnUrl || result.fileUrl;

    } catch (uploadError) {
      const error = uploadError instanceof Error ? uploadError : new Error('Avatar upload failed');
      setError(error);
      onError?.(error);
      throw error;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [
    entityId,
    bucket,
    validateAvatarFile,
    optimizeAvatarImage,
    getAvatarFilename,
    getAvatarFolder,
    onSuccess,
    onError,
  ]);

  // Update avatar URL in database
  const updateAvatarInDatabase = useCallback(async (newAvatarUrl: string) => {
    if (!entityId) return;

    const API_BASE_URL = import.meta.env.VITE_PUBLIC_API_BASE || 'https://api.matbakh.app';
    const authToken = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    const response = await fetch(`${API_BASE_URL}/avatar/${entityType}/${entityId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        avatarUrl: newAvatarUrl,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to update avatar in database');
    }
  }, [entityId, entityType]);

  // Delete avatar
  const deleteAvatar = useCallback(async () => {
    if (!entityId) {
      throw new Error('User ID or Partner ID is required for avatar deletion');
    }

    setIsLoading(true);
    setError(null);

    try {
      // Delete from database
      const API_BASE_URL = import.meta.env.VITE_PUBLIC_API_BASE || 'https://api.matbakh.app';
      const authToken = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const response = await fetch(`${API_BASE_URL}/avatar/${entityType}/${entityId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete avatar');
      }

      // Update local state to fallback
      setAvatarUrl(getFallbackUrl());

    } catch (deleteError) {
      const error = deleteError instanceof Error ? deleteError : new Error('Avatar deletion failed');
      setError(error);
      onError?.(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [entityId, entityType, getFallbackUrl, onError]);

  // Refresh avatar (reload from server)
  const refreshAvatar = useCallback(async () => {
    await loadAvatarUrl();
  }, [loadAvatarUrl]);

  // Set preview from file
  const setPreviewFromFile = useCallback(async (file: File) => {
    try {
      // Validate file first
      const validation = validateAvatarFile(file);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Create preview URL
      const preview = URL.createObjectURL(file);

      // Clean up previous preview
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }

      setPreviewUrl(preview);
      setError(null);

    } catch (previewError) {
      const error = previewError instanceof Error ? previewError : new Error('Preview generation failed');
      setError(error);
      throw error;
    }
  }, [previewUrl, validateAvatarFile]);

  // Clear preview
  const clearPreview = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  }, [previewUrl]);

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return {
    // State
    avatarUrl: avatarUrl || getFallbackUrl(),
    isLoading,
    isUploading,
    uploadProgress,
    error,

    // Methods
    uploadAvatar,
    deleteAvatar,
    refreshAvatar,

    // Preview
    previewUrl,
    setPreviewFromFile,
    clearPreview,
  };
}

export default useAvatar;