import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock the RDS client
const mockExecuteQuery = jest.fn();
const mockMapRecord = jest.fn();

jest.mock('../aws-rds-client', () => ({
  executeQuery: mockExecuteQuery,
  mapRecord: mockMapRecord,
}));

import profileService from '../ProfileService';

describe('ProfileService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockExecuteQuery.mockClear();
    mockMapRecord.mockClear();
  });

  describe('Business Profile Management', () => {
    const mockBusinessProfile = {
      id: 'profile-123',
      businessName: 'Test Restaurant',
      email: 'test@restaurant.com',
      phone: '+49123456789',
      address: {
        street: 'Teststraße 1',
        city: 'Berlin',
        postalCode: '10115',
        country: 'Germany'
      },
      category: 'Restaurant',
      website: 'https://test-restaurant.com',
      socialMedia: {
        facebook: 'test-restaurant',
        instagram: 'test_restaurant'
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    it('should create a new business profile', async () => {
      mockExecuteQuery.mockResolvedValue([{ id: 'profile-123', ...mockBusinessProfile }]);

      const profileData = {
        businessName: 'Test Restaurant',
        email: 'test@restaurant.com',
        phone: '+49123456789',
        address: {
          street: 'Teststraße 1',
          city: 'Berlin',
          postalCode: '10115',
          country: 'Germany'
        },
        category: 'Restaurant',
        website: 'https://test-restaurant.com'
      };

      const result = await profileService.createProfile(profileData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(expect.objectContaining({
        businessName: 'Test Restaurant',
        email: 'test@restaurant.com'
      }));
      expect(mockExecuteQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO profiles'),
        expect.arrayContaining([
          expect.objectContaining({
            businessName: 'Test Restaurant',
            email: 'test@restaurant.com',
            phone: '+49123456789'
          })
        ])
      );
    });

    it('should retrieve business profile by ID', async () => {
      mockExecuteQuery.mockResolvedValue([mockBusinessProfile]);
      mockMapRecord.mockReturnValue(mockBusinessProfile);

      const result = await profileService.getProfile('profile-123');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockBusinessProfile);
      expect(mockExecuteQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM profiles WHERE id = ?'),
        ['profile-123']
      );
    });

    it('should update existing business profile', async () => {
      const updatedProfile = { ...mockBusinessProfile, businessName: 'Updated Restaurant' };
      mockExecuteQuery.mockResolvedValue([updatedProfile]);

      const updateData = {
        businessName: 'Updated Restaurant',
        phone: '+49987654321'
      };

      const result = await profileService.updateProfile('profile-123', updateData);

      expect(result.success).toBe(true);
      expect(result.data.businessName).toBe('Updated Restaurant');
      expect(mockExecuteQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE profiles SET'),
        expect.arrayContaining(['profile-123'])
      );
    });

    it('should delete business profile', async () => {
      mockExecuteQuery.mockResolvedValue([{ affectedRows: 1 }]);

      const result = await profileService.deleteProfile('profile-123');

      expect(result.success).toBe(true);
      expect(mockExecuteQuery).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM profiles WHERE id = ?'),
        ['profile-123']
      );
    });

    it('should handle profile not found', async () => {
      mockExecuteQuery.mockResolvedValue([]);

      const result = await profileService.getProfile('non-existent-id');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Profile not found');
    });

    it('should validate required fields on creation', async () => {
      const invalidProfileData = {
        // Missing required businessName
        email: 'test@restaurant.com'
      };

      const result = await profileService.createProfile(invalidProfileData as any);

      expect(result.success).toBe(false);
      expect(result.error).toContain('businessName is required');
    });

    it('should validate email format', async () => {
      const invalidProfileData = {
        businessName: 'Test Restaurant',
        email: 'invalid-email'
      };

      const result = await profileService.createProfile(invalidProfileData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid email format');
    });
  });

  describe('Profile Search and Filtering', () => {
    it('should search profiles by business name', async () => {
      const mockProfiles = [
        { id: '1', businessName: 'Pizza Palace', category: 'Restaurant' },
        { id: '2', businessName: 'Pizza Corner', category: 'Restaurant' }
      ];
      mockExecuteQuery.mockResolvedValue(mockProfiles);

      const result = await profileService.searchProfiles({ businessName: 'Pizza' });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(mockExecuteQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM profiles WHERE'),
        expect.arrayContaining([
          expect.objectContaining({ businessName: 'Pizza' })
        ])
      );
    });

    it('should filter profiles by category', async () => {
      const mockProfiles = [
        { id: '1', businessName: 'Test Restaurant', category: 'Restaurant' }
      ];
      mockExecuteQuery.mockResolvedValue(mockProfiles);

      const result = await profileService.searchProfiles({ category: 'Restaurant' });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(mockExecuteQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM profiles WHERE'),
        expect.arrayContaining([
          expect.objectContaining({ category: 'Restaurant' })
        ])
      );
    });

    it('should filter profiles by location', async () => {
      const mockProfiles = [
        { id: '1', businessName: 'Berlin Restaurant', city: 'Berlin' }
      ];
      mockExecuteQuery.mockResolvedValue(mockProfiles);

      const result = await profileService.searchProfiles({ city: 'Berlin' });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(mockExecuteQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM profiles WHERE'),
        expect.arrayContaining([
          expect.objectContaining({ city: 'Berlin' })
        ])
      );
    });
  });

  describe('Profile Analytics', () => {
    it('should get profile completion percentage', async () => {
      const incompleteProfile = {
        id: 'profile-123',
        businessName: 'Test Restaurant',
        email: 'test@restaurant.com',
        // Missing phone, address, website, etc.
      };

      const completionPercentage = await profileService.getProfileCompletion(incompleteProfile);

      expect(completionPercentage).toBeGreaterThan(0);
      expect(completionPercentage).toBeLessThan(100);
    });

    it('should identify missing profile fields', async () => {
      const incompleteProfile = {
        id: 'profile-123',
        businessName: 'Test Restaurant',
        email: 'test@restaurant.com',
        // Missing other fields
      };

      const missingFields = await profileService.getMissingFields(incompleteProfile);

      expect(missingFields).toContain('phone');
      expect(missingFields).toContain('address');
      expect(missingFields).toContain('website');
    });

    it('should suggest profile improvements', async () => {
      const profile = {
        id: 'profile-123',
        businessName: 'Test Restaurant',
        email: 'test@restaurant.com',
        phone: '+49123456789',
        // Missing social media, website
      };

      const suggestions = await profileService.getProfileSuggestions(profile);

      expect(suggestions).toContain('Add website URL to improve online presence');
      expect(suggestions).toContain('Add social media profiles to increase visibility');
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      mockExecuteQuery.mockRejectedValue(new Error('Database connection failed'));

      const result = await profileService.getProfile('profile-123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Database connection failed');
    });

    it('should handle SQL syntax errors', async () => {
      mockExecuteQuery.mockRejectedValue(new Error('SQL syntax error'));

      const result = await profileService.createProfile({
        businessName: 'Test Restaurant',
        email: 'test@restaurant.com'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('SQL syntax error');
    });

    it('should handle duplicate email errors', async () => {
      mockExecuteQuery.mockRejectedValue(new Error('Duplicate entry for email'));

      const result = await profileService.createProfile({
        businessName: 'Test Restaurant',
        email: 'existing@restaurant.com'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Duplicate entry for email');
    });
  });

  describe('Integration Tests', () => {
    it('should complete full profile lifecycle', async () => {
      // 1. Create profile
      mockExecuteQuery.mockResolvedValueOnce([{ id: 'profile-123' }]);
      
      const createResult = await profileService.createProfile({
        businessName: 'Test Restaurant',
        email: 'test@restaurant.com',
        phone: '+49123456789'
      });
      
      expect(createResult.success).toBe(true);

      // 2. Get profile
      const mockProfile = {
        id: 'profile-123',
        businessName: 'Test Restaurant',
        email: 'test@restaurant.com',
        phone: '+49123456789'
      };
      mockExecuteQuery.mockResolvedValueOnce([mockProfile]);
      mockMapRecord.mockReturnValue(mockProfile);

      const getResult = await profileService.getProfile('profile-123');
      expect(getResult.success).toBe(true);
      expect(getResult.data.businessName).toBe('Test Restaurant');

      // 3. Update profile
      const updatedProfile = { ...mockProfile, businessName: 'Updated Restaurant' };
      mockExecuteQuery.mockResolvedValueOnce([]); // UPDATE query
      mockExecuteQuery.mockResolvedValueOnce([updatedProfile]); // SELECT query
      mockMapRecord.mockReturnValue(updatedProfile);

      const updateResult = await profileService.updateProfile('profile-123', {
        businessName: 'Updated Restaurant'
      });
      expect(updateResult.success).toBe(true);

      // 4. Delete profile
      mockExecuteQuery.mockResolvedValueOnce([{ affectedRows: 1 }]);

      const deleteResult = await profileService.deleteProfile('profile-123');
      expect(deleteResult.success).toBe(true);
    });
  });
});