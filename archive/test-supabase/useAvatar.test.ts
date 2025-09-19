/**
 * Unit tests for useAvatar hook
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useAvatar } from '../useAvatar';
import * as s3Upload from '@/lib/s3-upload';

// Mock the s3-upload library
jest.mock('@/lib/s3-upload');
const mockS3Upload = s3Upload as jest.Mocked<typeof s3Upload>;

// Mock fetch
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock URL.createObjectURL and revokeObjectURL
global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = jest.fn();

// Mock environment variables
const originalEnv = process.env;
beforeAll(() => {
  process.env = {
    ...originalEnv,
    VITE_PUBLIC_API_BASE: 'https://test-api.matbakh.app',
  };
});

afterAll(() => {
  process.env = originalEnv;
});

describe('useAvatar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue('test-auth-token');
    
    // Mock successful upload
    mockS3Upload.uploadWithCompression.mockResolvedValue({
      fileUrl: 'https://s3.amazonaws.com/test-bucket/avatar.jpg',
      cdnUrl: 'https://cdn.matbakh.app/avatar.jpg',
      uploadId: 'test-upload-id',
      checksum: 'test-checksum',
    });

    // Mock successful validation
    mockS3Upload.validateFile.mockReturnValue({ valid: true });

    // Mock successful compression
    mockS3Upload.compressImage.mockImplementation(async (file) => file);
  });

  describe('initialization', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useAvatar());

      expect(result.current.avatarUrl).toBe('/images/default-avatar.svg');
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isUploading).toBe(false);
      expect(result.current.uploadProgress).toBe(0);
      expect(result.current.error).toBe(null);
      expect(result.current.previewUrl).toBe(null);
    });

    it('should use custom fallback URL', () => {
      const { result } = renderHook(() =>
        useAvatar({ fallbackUrl: '/custom-avatar.png' })
      );

      expect(result.current.avatarUrl).toBe('/custom-avatar.png');
    });

    it('should use entity-specific fallback', () => {
      const { result: userResult } = renderHook(() =>
        useAvatar({ userId: 'user123' })
      );
      expect(userResult.current.avatarUrl).toBe('/images/default-user-avatar.svg');

      const { result: partnerResult } = renderHook(() =>
        useAvatar({ partnerId: 'partner123' })
      );
      expect(partnerResult.current.avatarUrl).toBe('/images/default-partner-avatar.svg');
    });
  });

  describe('loadAvatarUrl', () => {
    it('should load avatar URL for user', async () => {
      const mockResponse = { avatarUrl: 'https://cdn.matbakh.app/user-avatar.jpg' };
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const { result } = renderHook(() => useAvatar({ userId: 'user123' }));

      await waitFor(() => {
        expect(result.current.avatarUrl).toBe('https://cdn.matbakh.app/user-avatar.jpg');
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test-api.matbakh.app/avatar/user/user123',
        {
          method: 'GET',
          headers: { Authorization: 'Bearer test-auth-token' },
        }
      );
    });

    it('should load avatar URL for partner', async () => {
      const mockResponse = { avatarUrl: 'https://cdn.matbakh.app/partner-avatar.jpg' };
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const { result } = renderHook(() => useAvatar({ partnerId: 'partner123' }));

      await waitFor(() => {
        expect(result.current.avatarUrl).toBe('https://cdn.matbakh.app/partner-avatar.jpg');
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test-api.matbakh.app/avatar/partner/partner123',
        {
          method: 'GET',
          headers: { Authorization: 'Bearer test-auth-token' },
        }
      );
    });

    it('should handle API error gracefully', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        statusText: 'Not Found',
      } as Response);

      const { result } = renderHook(() => useAvatar({ userId: 'user123' }));

      await waitFor(() => {
        expect(result.current.avatarUrl).toBe('/images/default-user-avatar.svg');
      });
    });

    it('should handle network error gracefully', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useAvatar({ userId: 'user123' }));

      await waitFor(() => {
        expect(result.current.avatarUrl).toBe('/images/default-user-avatar.svg');
      });
    });

    it('should set loading state during request', async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockFetch.mockReturnValue(promise as any);

      const { result } = renderHook(() => useAvatar({ userId: 'user123' }));

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolvePromise({
          ok: true,
          json: () => Promise.resolve({ avatarUrl: 'test-url' }),
        });
        await promise;
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('uploadAvatar', () => {
    const mockFile = new File(['test'], 'avatar.jpg', { type: 'image/jpeg' });

    it('should upload avatar successfully', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      } as Response);

      const onSuccess = jest.fn();
      const { result } = renderHook(() =>
        useAvatar({ userId: 'user123', onSuccess })
      );

      let uploadResult;
      await act(async () => {
        uploadResult = await result.current.uploadAvatar(mockFile);
      });

      expect(uploadResult).toBe('https://cdn.matbakh.app/avatar.jpg');
      expect(result.current.avatarUrl).toBe('https://cdn.matbakh.app/avatar.jpg');
      expect(onSuccess).toHaveBeenCalledWith('https://cdn.matbakh.app/avatar.jpg');
      expect(result.current.isUploading).toBe(false);
      expect(result.current.uploadProgress).toBe(0);
    });

    it('should handle upload with custom options', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      } as Response);

      const { result } = renderHook(() => useAvatar({ userId: 'user123' }));

      await act(async () => {
        await result.current.uploadAvatar(mockFile, {
          maxWidth: 800,
          maxHeight: 600,
          quality: 0.9,
          format: 'image/webp',
        });
      });

      expect(mockS3Upload.compressImage).toHaveBeenCalledWith(mockFile, {
        maxWidth: 800,
        maxHeight: 600,
        quality: 0.9,
        format: 'image/webp',
      });
    });

    it('should handle validation error', async () => {
      mockS3Upload.validateFile.mockReturnValue({
        valid: false,
        error: 'File too large',
      });

      const onError = jest.fn();
      const { result } = renderHook(() =>
        useAvatar({ userId: 'user123', onError })
      );

      await act(async () => {
        await expect(result.current.uploadAvatar(mockFile)).rejects.toThrow(
          'File too large'
        );
      });

      expect(onError).toHaveBeenCalledWith(expect.any(Error));
      expect(result.current.error).toBeInstanceOf(Error);
    });

    it('should handle upload error', async () => {
      mockS3Upload.uploadWithCompression.mockRejectedValue(
        new Error('Upload failed')
      );

      const onError = jest.fn();
      const { result } = renderHook(() =>
        useAvatar({ userId: 'user123', onError })
      );

      await act(async () => {
        await expect(result.current.uploadAvatar(mockFile)).rejects.toThrow(
          'Upload failed'
        );
      });

      expect(onError).toHaveBeenCalledWith(expect.any(Error));
      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.isUploading).toBe(false);
    });

    it('should handle database update error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        statusText: 'Internal Server Error',
      } as Response);

      const { result } = renderHook(() => useAvatar({ userId: 'user123' }));

      await act(async () => {
        await expect(result.current.uploadAvatar(mockFile)).rejects.toThrow(
          'Failed to update avatar in database'
        );
      });
    });

    it('should require entity ID', async () => {
      const { result } = renderHook(() => useAvatar());

      await act(async () => {
        await expect(result.current.uploadAvatar(mockFile)).rejects.toThrow(
          'User ID or Partner ID is required for avatar upload'
        );
      });
    });

    it('should track upload progress', async () => {
      let progressCallback: ((progress: number) => void) | undefined;

      mockS3Upload.uploadWithCompression.mockImplementation(
        async ({ onProgress }) => {
          progressCallback = onProgress;
          return {
            fileUrl: 'https://s3.amazonaws.com/test-bucket/avatar.jpg',
            cdnUrl: 'https://cdn.matbakh.app/avatar.jpg',
            uploadId: 'test-upload-id',
            checksum: 'test-checksum',
          };
        }
      );

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      } as Response);

      const { result } = renderHook(() => useAvatar({ userId: 'user123' }));

      const uploadPromise = act(async () => {
        await result.current.uploadAvatar(mockFile);
      });

      // Simulate progress updates
      if (progressCallback) {
        act(() => {
          progressCallback!(50);
        });
        expect(result.current.uploadProgress).toBeGreaterThan(20);
      }

      await uploadPromise;
    });

    it('should handle compression failure gracefully', async () => {
      mockS3Upload.compressImage.mockRejectedValue(new Error('Compression failed'));

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      } as Response);

      const { result } = renderHook(() => useAvatar({ userId: 'user123' }));

      // Should still succeed with original file
      await act(async () => {
        await result.current.uploadAvatar(mockFile);
      });

      expect(mockS3Upload.uploadWithCompression).toHaveBeenCalledWith(
        expect.objectContaining({
          file: mockFile, // Original file used
        })
      );
    });
  });

  describe('deleteAvatar', () => {
    it('should delete avatar successfully', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
      } as Response);

      const { result } = renderHook(() => useAvatar({ userId: 'user123' }));

      await act(async () => {
        await result.current.deleteAvatar();
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test-api.matbakh.app/avatar/user/user123',
        {
          method: 'DELETE',
          headers: { Authorization: 'Bearer test-auth-token' },
        }
      );

      expect(result.current.avatarUrl).toBe('/images/default-user-avatar.svg');
    });

    it('should handle delete error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        statusText: 'Not Found',
      } as Response);

      const onError = jest.fn();
      const { result } = renderHook(() =>
        useAvatar({ userId: 'user123', onError })
      );

      await act(async () => {
        await expect(result.current.deleteAvatar()).rejects.toThrow(
          'Failed to delete avatar'
        );
      });

      expect(onError).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should require entity ID', async () => {
      const { result } = renderHook(() => useAvatar());

      await act(async () => {
        await expect(result.current.deleteAvatar()).rejects.toThrow(
          'User ID or Partner ID is required for avatar deletion'
        );
      });
    });
  });

  describe('preview functionality', () => {
    const mockFile = new File(['test'], 'avatar.jpg', { type: 'image/jpeg' });

    it('should set preview from file', async () => {
      const { result } = renderHook(() => useAvatar());

      await act(async () => {
        await result.current.setPreviewFromFile(mockFile);
      });

      expect(result.current.previewUrl).toBe('blob:mock-url');
      expect(URL.createObjectURL).toHaveBeenCalledWith(mockFile);
    });

    it('should validate file before preview', async () => {
      mockS3Upload.validateFile.mockReturnValue({
        valid: false,
        error: 'Invalid file type',
      });

      const { result } = renderHook(() => useAvatar());

      await act(async () => {
        await expect(result.current.setPreviewFromFile(mockFile)).rejects.toThrow(
          'Invalid file type'
        );
      });

      expect(result.current.previewUrl).toBe(null);
    });

    it('should clear previous preview when setting new one', async () => {
      const { result } = renderHook(() => useAvatar());

      // Set first preview
      await act(async () => {
        await result.current.setPreviewFromFile(mockFile);
      });

      const firstPreviewUrl = result.current.previewUrl;

      // Set second preview
      await act(async () => {
        await result.current.setPreviewFromFile(mockFile);
      });

      expect(URL.revokeObjectURL).toHaveBeenCalledWith(firstPreviewUrl);
    });

    it('should clear preview', () => {
      const { result } = renderHook(() => useAvatar());

      act(() => {
        result.current.setPreviewFromFile(mockFile);
      });

      act(() => {
        result.current.clearPreview();
      });

      expect(result.current.previewUrl).toBe(null);
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });

    it('should cleanup preview on unmount', () => {
      const { result, unmount } = renderHook(() => useAvatar());

      act(() => {
        result.current.setPreviewFromFile(mockFile);
      });

      unmount();

      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });
  });

  describe('refreshAvatar', () => {
    it('should refresh avatar URL', async () => {
      const mockResponse = { avatarUrl: 'https://cdn.matbakh.app/new-avatar.jpg' };
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const { result } = renderHook(() => useAvatar({ userId: 'user123' }));

      await act(async () => {
        await result.current.refreshAvatar();
      });

      expect(result.current.avatarUrl).toBe('https://cdn.matbakh.app/new-avatar.jpg');
    });
  });

  describe('file validation', () => {
    it('should validate avatar file types', () => {
      const { result } = renderHook(() => useAvatar());

      // Valid image file
      const validFile = new File(['test'], 'avatar.jpg', { type: 'image/jpeg' });
      mockS3Upload.validateFile.mockReturnValue({ valid: true });

      act(() => {
        result.current.setPreviewFromFile(validFile);
      });

      expect(mockS3Upload.validateFile).toHaveBeenCalledWith(validFile, 5 * 1024 * 1024);
    });

    it('should reject non-image files', async () => {
      const invalidFile = new File(['test'], 'document.pdf', { type: 'application/pdf' });
      mockS3Upload.validateFile.mockReturnValue({
        valid: false,
        error: 'Avatar must be a JPEG, PNG, WebP, or GIF image',
      });

      const { result } = renderHook(() => useAvatar({ userId: 'user123' }));

      await act(async () => {
        await expect(result.current.uploadAvatar(invalidFile)).rejects.toThrow(
          'Avatar must be a JPEG, PNG, WebP, or GIF image'
        );
      });
    });
  });

  describe('folder and filename generation', () => {
    it('should generate correct folder path for user', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      } as Response);

      const { result } = renderHook(() =>
        useAvatar({ userId: 'user123', folder: 'avatars' })
      );

      const mockFile = new File(['test'], 'avatar.jpg', { type: 'image/jpeg' });

      await act(async () => {
        await result.current.uploadAvatar(mockFile);
      });

      expect(mockS3Upload.uploadWithCompression).toHaveBeenCalledWith(
        expect.objectContaining({
          folder: 'avatars/user123',
        })
      );
    });

    it('should generate timestamped filename', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      } as Response);

      const { result } = renderHook(() => useAvatar({ userId: 'user123' }));

      const mockFile = new File(['test'], 'original.jpg', { type: 'image/jpeg' });

      await act(async () => {
        await result.current.uploadAvatar(mockFile);
      });

      // Check that a timestamped filename was generated
      const uploadCall = mockS3Upload.uploadWithCompression.mock.calls[0][0];
      expect(uploadCall.file.name).toMatch(/^avatar_\d+\.jpg$/);
    });
  });

  describe('error handling', () => {
    it('should handle unknown errors gracefully', async () => {
      mockS3Upload.uploadWithCompression.mockRejectedValue('Unknown error');

      const { result } = renderHook(() => useAvatar({ userId: 'user123' }));

      const mockFile = new File(['test'], 'avatar.jpg', { type: 'image/jpeg' });

      await act(async () => {
        await expect(result.current.uploadAvatar(mockFile)).rejects.toThrow(
          'Avatar upload failed'
        );
      });

      expect(result.current.error).toBeInstanceOf(Error);
    });

    it('should clear error on successful operation', async () => {
      // First, cause an error
      mockS3Upload.validateFile.mockReturnValue({
        valid: false,
        error: 'Test error',
      });

      const { result } = renderHook(() => useAvatar({ userId: 'user123' }));

      const mockFile = new File(['test'], 'avatar.jpg', { type: 'image/jpeg' });

      await act(async () => {
        await expect(result.current.uploadAvatar(mockFile)).rejects.toThrow();
      });

      expect(result.current.error).toBeTruthy();

      // Then, succeed
      mockS3Upload.validateFile.mockReturnValue({ valid: true });
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      } as Response);

      await act(async () => {
        await result.current.uploadAvatar(mockFile);
      });

      expect(result.current.error).toBe(null);
    });
  });
});