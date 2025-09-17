/**
 * AWS RDS ProfileService - Migrated from Supabase
 * 
 * @description Handles user profile data storage in AWS RDS
 * @usage Planned integration with onboarding wizard and user profile management
 * @status DEVELOPMENT - Ready for integration, awaiting UI connection
 * @todo Add import to profile-api.ts or onboarding-manager.ts
 */

import { rdsClient } from '@/services/aws-rds-client';
import type { OnboardingData, ServiceResponse } from '@/types/businessProfile';

export class ProfileService {
  
  /**
   * Save onboarding data to AWS RDS
   */
  static async saveOnboardingData(userId: string, data: OnboardingData): Promise<ServiceResponse<any>> {
    try {
      const profileData = await rdsClient.queryOne(
        `INSERT INTO profiles (user_id, company_name, address, phone, website, description, registration_type, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
         ON CONFLICT (user_id) 
         DO UPDATE SET 
           company_name = EXCLUDED.company_name,
           address = EXCLUDED.address,
           phone = EXCLUDED.phone,
           website = EXCLUDED.website,
           description = EXCLUDED.description,
           updated_at = NOW()
         RETURNING *`,
        [
          userId,
          data.company_name,
          data.address,
          data.phone,
          data.website,
          data.description,
          'email'
        ]
      );

      return {
        success: true,
        data: profileData,
        message: 'Profil erfolgreich gespeichert'
      };

    } catch (error) {
      console.error('ProfileService: Error saving profile:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Fehler beim Speichern des Profils'
      };
    }
  }

  /**
   * Load onboarding data from AWS RDS
   */
  static async getOnboardingData(userId: string): Promise<ServiceResponse<any>> {
    try {
      const profileData = await rdsClient.queryOne(
        'SELECT * FROM profiles WHERE user_id = $1',
        [userId]
      );
      
      if (!profileData) {
        return {
          success: false,
          message: 'Keine Profildaten gefunden'
        };
      }

      return {
        success: true,
        data: profileData
      };

    } catch (error) {
      console.error('ProfileService: Error loading profile:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Fehler beim Laden der Profildaten'
      };
    }
  }

  /**
   * Delete profile data from AWS RDS
   */
  static async deleteProfile(userId: string): Promise<ServiceResponse<any>> {
    try {
      await rdsClient.query(
        'DELETE FROM profiles WHERE user_id = $1',
        [userId]
      );

      return {
        success: true,
        message: 'Profil erfolgreich gelöscht'
      };

    } catch (error) {
      console.error('ProfileService: Error deleting profile:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Fehler beim Löschen des Profils'
      };
    }
  }

  /**
   * Test AWS RDS connection
   */
  static async testConnection(): Promise<boolean> {
    try {
      return await rdsClient.testConnection();
    } catch (error) {
      console.error('ProfileService: Connection test failed:', error);
      return false;
    }
  }
}