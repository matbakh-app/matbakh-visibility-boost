
/**
 * Legacy localStorage utilities
 * 
 * @deprecated Use useLocalStorage hooks instead
 * @version 1.0.0 (deprecated)
 * @since 2024
 * @willBeRemovedIn v2.0
 * 
 * These utilities have been migrated to the generic useLocalStorage pattern.
 * Please use useOnboardingStorage from '@/hooks/useLocalStorage' instead.
 */

import { clearExpiredLocalStorage } from '@/hooks/useLocalStorage';

/**
 * @deprecated Use useOnboardingStorage from useLocalStorage instead
 */
export const onboardingStorage = {
  save: (step: number, data: any) => {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        '⚠️ DEPRECATED: onboardingStorage.save is deprecated.\n' +
        '   Please use useOnboardingStorage hook instead.\n' +
        '   Migration: const { saveOnboarding } = useOnboardingStorage();'
      );
    }

    try {
      const storageData = {
        version: data.version || '1.0',
        currentStep: step,
        answers: data.answers || data,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem('matbakh_onboarding_data', JSON.stringify(storageData));
    } catch (error) {
      console.error('Failed to save onboarding data:', error);
    }
  },

  restore: (): { version: string; currentStep: number; answers: any; timestamp: string } | null => {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        '⚠️ DEPRECATED: onboardingStorage.restore is deprecated.\n' +
        '   Please use useOnboardingStorage hook instead.\n' +
        '   Migration: const { data } = useOnboardingStorage();'
      );
    }

    try {
      const stored = localStorage.getItem('matbakh_onboarding_data');
      if (!stored) return null;
      
      const parsed = JSON.parse(stored);
      
      // Check if data is not older than 24 hours
      const timestamp = new Date(parsed.timestamp);
      const now = new Date();
      const hoursDiff = (now.getTime() - timestamp.getTime()) / (1000 * 60 * 60);
      
      if (hoursDiff > 24) {
        localStorage.removeItem('matbakh_onboarding_data');
        return null;
      }
      
      return {
        version: parsed.version || '1.0',
        currentStep: parsed.currentStep || parsed.step || 1,
        answers: parsed.answers || parsed.data || {},
        timestamp: parsed.timestamp
      };
    } catch (error) {
      console.error('Failed to restore onboarding data:', error);
      localStorage.removeItem('matbakh_onboarding_data');
      return null;
    }
  },

  clear: () => {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        '⚠️ DEPRECATED: onboardingStorage.clear is deprecated.\n' +
        '   Please use useOnboardingStorage hook instead.\n' +
        '   Migration: const { clearOnboarding } = useOnboardingStorage();'
      );
    }

    try {
      localStorage.removeItem('matbakh_onboarding_data');
    } catch (error) {
      console.error('Failed to clear onboarding data:', error);
    }
  }
};

/**
 * @deprecated Use clearExpiredLocalStorage from useLocalStorage instead
 */
export const clearExpiredData = () => {
  if (process.env.NODE_ENV !== 'production') {
    console.warn(
      '⚠️ DEPRECATED: clearExpiredData is deprecated.\n' +
      '   Please use clearExpiredLocalStorage from @/hooks/useLocalStorage instead.'
    );
  }

  clearExpiredLocalStorage();
};
