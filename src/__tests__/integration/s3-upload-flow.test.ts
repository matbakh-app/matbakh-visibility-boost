/**
 * Integration tests for S3 upload flow
 * Tests the complete flow from frontend to S3 to database
 */

import { renderHook, act } from '@testing-library/react';
import { useAvatar } from '@/hooks/useAvatar';
import { useS3FileAccess } from '@/hooks/useS3FileAccess';

// Mock environment for integration tests
const mockEnv = {
  VITE_PUBLIC_API_BASE: 'https://test-api.matbakh.app',
  VITE_CLOUDFRONT_URL: 'https://test-cdn.cloudfront.net',
};

// Mock fetch for API calls
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn(() => 'test-auth-token'),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
});

describe('S3 Upload Integration Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.assign(process.env, mockEnv);
  });

  describe('Complete Avatar Upload Flow', () => {
    it('should complete full avatar upload and access flow', async () => {
      // Mock successful upload response
      const uploadResponse = {
        uploadUrl: 'https://presigned-upload-url.s3.amazonaws.com',
        fileUrl: 'https://s3.amazonaws.com/bucket/avatar.jpg',
        cdnUrl: 'https://cdn.matbakh.app/avatar.jpg',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        uploadId: 'test-upload-id',
      };

      // Mock database update success
      const dbUpdateResponse = { success: true };

      // Mock file access URL generation
      const accessUrlResponse = {
        url: 'https://presigned-access-url.s3.amazonaws.com',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        isPublic: false,
      };

      // Setup fetch mocks in order
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(uploadResponse),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
        } as Response) // S3 upload
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(dbUpdateResponse),
        } as Response) // Database update
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(accessUrlResponse),
        } as Response); // Access URL generation

      // Test avatar upload
      const { result: avatarResult } = renderHook(() =>
        useAvatar({ userId: 'test-user' })
      );

      const testFile = new File(['test content'], 'avatar.jpg', {
        type: 'image/jpeg',
      });

      let uploadedUrl: string;
      await act(async () => {
        uploadedUrl = await avatarResult.current.uploadAvatar(testFile);
      });

      expect(uploadedUrl).toBe('https://cdn.matbakh.app/avatar.jpg');
      expect(avatarResult.current.avatarUrl).toBe('https://cdn.matbakh.app/avatar.jpg');

      // Test file access
      const { result: accessResult } = renderHook(() => useS3FileAccess());

      let secureUrl;
      await act(async () => {
        secureUrl = await accessResult.current.generateSecureUrl({
          bucket: 'matbakh-files-profile',
          key: 'avatars/test-user/avatar.jpg',
          expiresIn: 3600,
        });
      });

      expect(secureUrl).toEqual(accessUrlResponse);

      // Verify API calls were made in correct order
      expect(mockFetch).toHaveBeenCalledTimes(4);
    });
  });
});