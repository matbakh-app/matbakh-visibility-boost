// Phase 1: Vereinfachter ProfileService für Phase 1 Testing

import { supabase } from '@/integrations/supabase/client';
import type { OnboardingData, ServiceResponse } from '@/types/businessProfile';

export class ProfileService {
  
  /**
   * Phase 1: Einfache Datenspeicherung für Testing
   */
  static async saveOnboardingData(userId: string, data: OnboardingData): Promise<ServiceResponse<any>> {
    try {
      // Phase 1: Lokal speichern für Testing
      const profileData = {
        user_id: userId,
        company_name: data.company_name,
        address: data.address,
        phone: data.phone,
        website: data.website,
        description: data.description,
        registration_type: 'email',
        created_at: new Date().toISOString()
      };

      localStorage.setItem(`profile_${userId}`, JSON.stringify(profileData));

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
   * Phase 1: Einfaches Laden der Daten
   */
  static async getOnboardingData(userId: string): Promise<ServiceResponse<any>> {
    try {
      const stored = localStorage.getItem(`profile_${userId}`);
      
      if (!stored) {
        return {
          success: false,
          message: 'Keine Profildaten gefunden'
        };
      }

      return {
        success: true,
        data: JSON.parse(stored)
      };

    } catch (error) {
      return {
        success: false,
        error: 'Fehler beim Laden der Profildaten'
      };
    }
  }
}