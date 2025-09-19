/**
 * useS3FileAccess Hook - React hook for secure S3 file URL generation and access
 */

import { useState, useCallback, useEffect } from 'react';
import type { BucketType } from '@/lib/s3-upload';

export interface SecureFileUrlOptions {
  bucket: BucketType;
  key: string;
  expiresIn?: number; // seconds, default 3600 (1 hour)
  responseContentType?: string;
  responseContentDisposition?: string;
}

export interface SecureFileUrlResult {
  url: string;
  expiresAt: string;
  isPublic: boolean;
}

export interface UseS3FileAccessOptions {
  autoRefresh?: boolean; // Auto-refresh URLs before expiry
  refreshBuffer?: number; // Refresh buffer in seconds (default 300 = 5 minutes)
  cacheUrls?: boolean; // Cache URLs to avoid repeated requests
}

export interface UseS3FileAccessReturn {
  // URL generation
  generateSecureUrl: (options: SecureFileUrlOptions) => Promise<SecureFileUrlResult>;
  getCdnUrl: (bucket: BucketType, key: string) => string;
  
  // Batch operations
  generateMultipleUrls: (requests: SecureFileUrlOptions[]) => Promise<SecureFileUrlResult[]>;
  
  // State management
  isGenerating: boolean;
  error: Error | null;
  
  // Cache management
  getCachedUrl: (bucket: BucketType, key: string) => SecureFileUrlResult | null;
  clearCache: () => void;
  clearExpiredUrls: () => void;
  
  // File operations
  downloadFile: (bucket: BucketType, key: string, filename?: string) => Promise<void>;
  preloadFile: (bucket: BucketType, key: string) => Promise<void>;
  
  // Utilities
  isUrlExpired: (url: SecureFileUrlResult) => boolean;
  getTimeUntilExpiry: (url: SecureFileUrlResult) => number; // seconds
}

interface CachedUrl extends SecureFileUrlResult {
  cacheKey: string;
  generatedAt: number;
}

const DEFAULT_OPTIONS: Required<UseS3FileAccessOptions> = {
  autoRefresh: true,
  refreshBuffer: 300, // 5 minutes
  cacheUrls: true,
};

// CloudFront distribution URL (for public files)
// Statt import.meta.env:
const env = (globalThis as any).importMetaEnv ?? process.env;
const CLOUDFRONT_URL = env.VITE_CLOUDFRONT_URL || 'https://files.matbakh.app';
const API_BASE_URL = env.VITE_PUBLIC_API_BASE || 'https://api.matbakh.app';

/**
 * React hook for secure S3 file access and URL generation
 */
export function useS3FileAccess(options: UseS3FileAccessOptions = {}): UseS3FileAccessReturn {
  const config = { ...DEFAULT_OPTIONS, ...options };

  // State
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [urlCache, setUrlCache] = useState<Map<string, CachedUrl>>(new Map());

  // Get authentication token
  const getAuthToken = useCallback(() => {
    if (typeof window === 'undefined') return null;
    const ls = window.localStorage?.getItem('auth_token');
    const ss = window.sessionStorage?.getItem('auth_token');
    if (ls) return ls;
    if (ss) return ss;
    // cookie fallback (decode & trim)
    const cookies = document.cookie?.split(';') ?? [];
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'auth_token' || name === 'access_token') {
        try { return decodeURIComponent(value); } catch { return value; }
      }
    }
    return null;
  }, []);

  // Generate cache key
  const generateCacheKey = useCallback((bucket: BucketType, key: string): string => {
    return `${bucket}:${key}`;
  }, []);

  // Check if URL is expired or will expire soon
  const isUrlExpired = useCallback((url: SecureFileUrlResult): boolean => {
    const expiryTime = new Date(url.expiresAt).getTime();
    const now = Date.now();
    const bufferTime = config.refreshBuffer * 1000;
    
    return now >= (expiryTime - bufferTime);
  }, [config.refreshBuffer]);

  // Get time until expiry in seconds
  const getTimeUntilExpiry = useCallback((url: SecureFileUrlResult): number => {
    const expiryTime = new Date(url.expiresAt).getTime();
    const now = Date.now();
    return Math.max(0, Math.floor((expiryTime - now) / 1000));
  }, []);

  // Get CDN URL for files that don't require authentication
  const getCdnUrl = useCallback((bucket: BucketType, key: string): string => {
    // Only reports bucket supports public access via CloudFront
    if (bucket === 'matbakh-files-reports') {
      return `${CLOUDFRONT_URL}/${key}`;
    }
    
    // For other buckets, return a placeholder or throw error
    throw new Error(`Public access not supported for bucket: ${bucket}`);
  }, []);

  // Generate secure presigned URL
  const generateSecureUrl = useCallback(async (
    urlOptions: SecureFileUrlOptions
  ): Promise<SecureFileUrlResult> => {
    const { bucket, key, expiresIn = 3600, responseContentType, responseContentDisposition } = urlOptions;
    
    setIsGenerating(true);
    setError(null);

    try {
      const authToken = getAuthToken();
      if (!authToken) {
        throw new Error('Authentication required for secure file access');
      }

      // Check cache first
      const cacheKey = generateCacheKey(bucket, key);
      if (config.cacheUrls) {
        const cached = urlCache.get(cacheKey);
        if (cached && !isUrlExpired(cached)) {
          return {
            url: cached.url,
            expiresAt: cached.expiresAt,
            isPublic: cached.isPublic,
          };
        }
      }

      const response = await fetch(`${API_BASE_URL}/get-file-access-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          bucket,
          key,
          expiresIn,
          responseContentType,
          responseContentDisposition,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate secure URL: ${response.statusText}`);
      }

      const result: SecureFileUrlResult = await response.json();

      // Cache the result
      if (config.cacheUrls) {
        const cachedUrl: CachedUrl = {
          ...result,
          cacheKey,
          generatedAt: Date.now(),
        };
        setUrlCache(prev => new Map(prev).set(cacheKey, cachedUrl));
      }

      return result;

    } catch (urlError) {
      const error = urlError instanceof Error ? urlError : new Error('Failed to generate secure URL');
      setError(error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  }, [getAuthToken, generateCacheKey, config.cacheUrls, urlCache, isUrlExpired]);

  // Generate multiple URLs in batch
  const generateMultipleUrls = useCallback(async (
    requests: SecureFileUrlOptions[]
  ): Promise<SecureFileUrlResult[]> => {
    setIsGenerating(true);
    setError(null);

    try {
      const authToken = getAuthToken();
      if (!authToken) {
        throw new Error('Authentication required for secure file access');
      }

      // Check cache for each request
      const results: SecureFileUrlResult[] = [];
      const uncachedRequests: (SecureFileUrlOptions & { index: number })[] = [];

      requests.forEach((request, index) => {
        const cacheKey = generateCacheKey(request.bucket, request.key);
        const cached = urlCache.get(cacheKey);
        
        if (config.cacheUrls && cached && !isUrlExpired(cached)) {
          results[index] = {
            url: cached.url,
            expiresAt: cached.expiresAt,
            isPublic: cached.isPublic,
          };
        } else {
          uncachedRequests.push({ ...request, index });
        }
      });

      // Fetch uncached URLs
      if (uncachedRequests.length > 0) {
        const response = await fetch(`${API_BASE_URL}/get-multiple-file-access-urls`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            requests: uncachedRequests.map(({ index, ...req }) => req),
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to generate secure URLs: ${response.statusText}`);
        }

        const batchResults: SecureFileUrlResult[] = await response.json();

        // Merge results and update cache
        uncachedRequests.forEach((request, batchIndex) => {
          const result = batchResults[batchIndex];
          results[request.index] = result;

          // Cache the result
          if (config.cacheUrls) {
            const cacheKey = generateCacheKey(request.bucket, request.key);
            const cachedUrl: CachedUrl = {
              ...result,
              cacheKey,
              generatedAt: Date.now(),
            };
            setUrlCache(prev => new Map(prev).set(cacheKey, cachedUrl));
          }
        });
      }

      return results;

    } catch (batchError) {
      const error = batchError instanceof Error ? batchError : new Error('Failed to generate secure URLs');
      setError(error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  }, [getAuthToken, generateCacheKey, config.cacheUrls, urlCache, isUrlExpired]);

  // Get cached URL
  const getCachedUrl = useCallback((bucket: BucketType, key: string): SecureFileUrlResult | null => {
    const cacheKey = generateCacheKey(bucket, key);
    const cached = urlCache.get(cacheKey);
    
    if (cached && !isUrlExpired(cached)) {
      return {
        url: cached.url,
        expiresAt: cached.expiresAt,
        isPublic: cached.isPublic,
      };
    }
    
    return null;
  }, [generateCacheKey, urlCache, isUrlExpired]);

  // Clear entire cache
  const clearCache = useCallback(() => {
    setUrlCache(new Map());
  }, []);

  // Clear expired URLs from cache
  const clearExpiredUrls = useCallback(() => {
    setUrlCache(prev => {
      const newCache = new Map();
      prev.forEach((cached, key) => {
        if (!isUrlExpired(cached)) {
          newCache.set(key, cached);
        }
      });
      return newCache;
    });
  }, [isUrlExpired]);

  // Download file
  const downloadFile = useCallback(async (
    bucket: BucketType,
    key: string,
    filename?: string
  ): Promise<void> => {
    try {
      // Generate secure URL with download disposition
      const result = await generateSecureUrl({
        bucket,
        key,
        responseContentDisposition: `attachment; filename="${filename || key.split('/').pop()}"`,
      });

      // Create temporary link and trigger download
      const link = document.createElement('a');
      link.href = result.url;
      link.download = filename || key.split('/').pop() || 'download';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (downloadError) {
      const error = downloadError instanceof Error ? downloadError : new Error('Download failed');
      setError(error);
      throw error;
    }
  }, [generateSecureUrl]);

  // Preload file (fetch and cache)
  const preloadFile = useCallback(async (bucket: BucketType, key: string): Promise<void> => {
    try {
      const result = await generateSecureUrl({ bucket, key });
      
      // Preload the file
      const response = await fetch(result.url, { method: 'HEAD' });
      if (!response.ok) {
        throw new Error(`Failed to preload file: ${response.statusText}`);
      }

    } catch (preloadError) {
      const error = preloadError instanceof Error ? preloadError : new Error('Preload failed');
      setError(error);
      throw error;
    }
  }, [generateSecureUrl]);

  // Auto-refresh expired URLs
  useEffect(() => {
    if (!config.autoRefresh) return;

    const interval = setInterval(() => {
      clearExpiredUrls();
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [config.autoRefresh, clearExpiredUrls]);

  return {
    // URL generation
    generateSecureUrl,
    getCdnUrl,
    generateMultipleUrls,

    // State
    isGenerating,
    error,

    // Cache management
    getCachedUrl,
    clearCache,
    clearExpiredUrls,

    // File operations
    downloadFile,
    preloadFile,

    // Utilities
    isUrlExpired,
    getTimeUntilExpiry,
  };
}

export default useS3FileAccess;