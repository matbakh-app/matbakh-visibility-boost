/**
 * Unit tests for security utilities
 */

import {
  validateMimeType,
  validateFilename,
  validateFileSize,
  validateBucketRules,
  generateSecureS3Key,
  sanitizeFilename,
  RateLimiter,
  ALLOWED_MIME_TYPES,
  BUCKET_RULES,
} from '../src/security';

describe('Security Utilities', () => {
  describe('validateMimeType', () => {
    test('should accept valid image MIME types', () => {
      expect(validateMimeType('image/jpeg')).toBe(true);
      expect(validateMimeType('image/png')).toBe(true);
      expect(validateMimeType('image/gif')).toBe(true);
      expect(validateMimeType('image/webp')).toBe(true);
    });

    test('should accept valid document MIME types', () => {
      expect(validateMimeType('application/pdf')).toBe(true);
      expect(validateMimeType('text/plain')).toBe(true);
      expect(validateMimeType('text/csv')).toBe(true);
    });

    test('should accept valid office document MIME types', () => {
      expect(validateMimeType('application/vnd.openxmlformats-officedocument.wordprocessingml.document')).toBe(true);
      expect(validateMimeType('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')).toBe(true);
    });

    test('should reject invalid MIME types', () => {
      expect(validateMimeType('application/x-executable')).toBe(false);
      expect(validateMimeType('text/javascript')).toBe(false);
      expect(validateMimeType('application/x-php')).toBe(false);
      expect(validateMimeType('video/mp4')).toBe(false);
    });

    test('should be case insensitive', () => {
      expect(validateMimeType('IMAGE/JPEG')).toBe(true);
      expect(validateMimeType('Image/Png')).toBe(true);
      expect(validateMimeType('APPLICATION/PDF')).toBe(true);
    });
  });

  describe('validateFilename', () => {
    test('should accept valid filenames', () => {
      expect(validateFilename('document.pdf').valid).toBe(true);
      expect(validateFilename('image.jpg').valid).toBe(true);
      expect(validateFilename('my-file_v2.docx').valid).toBe(true);
      expect(validateFilename('report-2024.xlsx').valid).toBe(true);
    });

    test('should reject filenames with dangerous extensions', () => {
      expect(validateFilename('malware.exe').valid).toBe(false);
      expect(validateFilename('script.bat').valid).toBe(false);
      expect(validateFilename('virus.scr').valid).toBe(false);
      expect(validateFilename('trojan.com').valid).toBe(false);
    });

    test('should reject filenames with suspicious patterns', () => {
      expect(validateFilename('../../../etc/passwd').valid).toBe(false);
      expect(validateFilename('file<script>.txt').valid).toBe(false);
      expect(validateFilename('file|pipe.txt').valid).toBe(false);
      expect(validateFilename('.hidden-file').valid).toBe(false);
    });

    test('should reject Windows reserved names', () => {
      expect(validateFilename('CON.txt').valid).toBe(false);
      expect(validateFilename('PRN.pdf').valid).toBe(false);
      expect(validateFilename('AUX.doc').valid).toBe(false);
      expect(validateFilename('COM1.jpg').valid).toBe(false);
    });

    test('should reject empty or too long filenames', () => {
      expect(validateFilename('').valid).toBe(false);
      expect(validateFilename('   ').valid).toBe(false);
      expect(validateFilename('a'.repeat(256)).valid).toBe(false);
    });
  });

  describe('validateFileSize', () => {
    test('should accept valid file sizes', () => {
      expect(validateFileSize(1024)).toBe(true); // 1KB
      expect(validateFileSize(1024 * 1024)).toBe(true); // 1MB
      expect(validateFileSize(5 * 1024 * 1024)).toBe(true); // 5MB
    });

    test('should reject invalid file sizes', () => {
      expect(validateFileSize(0)).toBe(false);
      expect(validateFileSize(-1)).toBe(false);
      expect(validateFileSize(20 * 1024 * 1024)).toBe(false); // 20MB (exceeds 10MB limit)
    });
  });

  describe('validateBucketRules', () => {
    test('should validate uploads bucket rules', () => {
      const result = validateBucketRules('matbakh-files-uploads', 'image/jpeg', 1024 * 1024);
      expect(result.valid).toBe(true);
    });

    test('should reject oversized files for profile bucket', () => {
      const result = validateBucketRules('matbakh-files-profile', 'image/jpeg', 10 * 1024 * 1024);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('5MB limit');
    });

    test('should reject invalid MIME types for bucket', () => {
      const result = validateBucketRules('matbakh-files-profile', 'application/pdf', 1024);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('not allowed');
    });

    test('should reject invalid folders', () => {
      const result = validateBucketRules('matbakh-files-uploads', 'image/jpeg', 1024, 'invalid-folder');
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('not allowed');
    });
  });

  describe('sanitizeFilename', () => {
    test('should sanitize dangerous characters', () => {
      expect(sanitizeFilename('file<>name.txt')).toBe('file__name.txt');
      expect(sanitizeFilename('file|with|pipes.pdf')).toBe('file_with_pipes.pdf');
      expect(sanitizeFilename('file with spaces.doc')).toBe('file_with_spaces.doc');
    });

    test('should remove multiple underscores', () => {
      expect(sanitizeFilename('file___name.txt')).toBe('file_name.txt');
      expect(sanitizeFilename('___file___.txt')).toBe('file.txt');
    });

    test('should limit filename length', () => {
      const longName = 'a'.repeat(250) + '.txt';
      const sanitized = sanitizeFilename(longName);
      expect(sanitized.length).toBeLessThanOrEqual(200);
    });
  });

  describe('generateSecureS3Key', () => {
    test('should generate secure keys for uploads bucket', () => {
      const key = generateSecureS3Key('matbakh-files-uploads', 'user-uploads', 'test.jpg', 'user123');
      expect(key).toMatch(/^user-uploads\/user123\/\d+-[a-z0-9]+-test\.jpg$/);
    });

    test('should generate secure keys for profile bucket with avatars', () => {
      const key = generateSecureS3Key('matbakh-files-profile', 'avatars', 'avatar.png', 'user123');
      expect(key).toMatch(/^avatars\/user123\/\d+-avatar\.png$/);
    });

    test('should generate secure keys for reports bucket', () => {
      const key = generateSecureS3Key('matbakh-files-reports', 'vc-reports', 'report.pdf');
      expect(key).toMatch(/^vc-reports\/\d+-[a-z0-9]+-report\.pdf$/);
    });

    test('should sanitize filenames in keys', () => {
      const key = generateSecureS3Key('matbakh-files-uploads', 'uploads', 'file with spaces.txt', 'user123');
      expect(key).toMatch(/file_with_spaces\.txt$/);
    });
  });

  describe('RateLimiter', () => {
    beforeEach(() => {
      // Clear rate limiter store before each test
      (RateLimiter as any).store.clear();
    });

    test('should allow requests within limit', () => {
      const userId = 'test-user';
      
      // First request should be allowed
      expect(RateLimiter.checkLimit(userId)).toBe(true);
      
      // Subsequent requests within limit should be allowed
      for (let i = 0; i < 8; i++) {
        expect(RateLimiter.checkLimit(userId)).toBe(true);
      }
    });

    test('should block requests exceeding limit', () => {
      const userId = 'test-user';
      
      // Use up the rate limit
      for (let i = 0; i < 10; i++) {
        RateLimiter.checkLimit(userId);
      }
      
      // Next request should be blocked
      expect(RateLimiter.checkLimit(userId)).toBe(false);
    });

    test('should reset rate limit after window expires', () => {
      const userId = 'test-user';
      
      // Mock Date.now to control time
      const originalNow = Date.now;
      let mockTime = 1000000;
      Date.now = jest.fn(() => mockTime);
      
      // Use up the rate limit
      for (let i = 0; i < 10; i++) {
        RateLimiter.checkLimit(userId);
      }
      
      // Should be blocked
      expect(RateLimiter.checkLimit(userId)).toBe(false);
      
      // Advance time past the window
      mockTime += 61000; // 61 seconds
      
      // Should be allowed again
      expect(RateLimiter.checkLimit(userId)).toBe(true);
      
      // Restore original Date.now
      Date.now = originalNow;
    });

    test('should track remaining requests correctly', () => {
      const userId = 'test-user';
      
      expect(RateLimiter.getRemainingRequests(userId)).toBe(10);
      
      RateLimiter.checkLimit(userId);
      expect(RateLimiter.getRemainingRequests(userId)).toBe(9);
      
      for (let i = 0; i < 5; i++) {
        RateLimiter.checkLimit(userId);
      }
      expect(RateLimiter.getRemainingRequests(userId)).toBe(4);
    });
  });
});