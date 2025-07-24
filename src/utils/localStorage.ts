
const ONBOARDING_STORAGE_KEY = 'matbakh_onboarding_data';

export const onboardingStorage = {
  save: (step: number, data: any) => {
    try {
      const storageData = {
        step,
        data,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(storageData));
    } catch (error) {
      console.error('Failed to save onboarding data:', error);
    }
  },

  restore: (): { step: number; data: any; timestamp: string } | null => {
    try {
      const stored = localStorage.getItem(ONBOARDING_STORAGE_KEY);
      if (!stored) return null;
      
      const parsed = JSON.parse(stored);
      
      // Check if data is not older than 24 hours
      const timestamp = new Date(parsed.timestamp);
      const now = new Date();
      const hoursDiff = (now.getTime() - timestamp.getTime()) / (1000 * 60 * 60);
      
      if (hoursDiff > 24) {
        localStorage.removeItem(ONBOARDING_STORAGE_KEY);
        return null;
      }
      
      return parsed;
    } catch (error) {
      console.error('Failed to restore onboarding data:', error);
      localStorage.removeItem(ONBOARDING_STORAGE_KEY);
      return null;
    }
  },

  clear: () => {
    try {
      localStorage.removeItem(ONBOARDING_STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear onboarding data:', error);
    }
  }
};
