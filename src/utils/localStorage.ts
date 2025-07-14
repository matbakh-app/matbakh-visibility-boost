
import { secureStorage } from './security';

// Enhanced localStorage wrapper with better error handling
const safeLocalStorage = {
  setItem: (key: string, value: any, expirationHours?: number) => {
    try {
      return secureStorage.setItem(key, value, expirationHours);
    } catch (error) {
      console.error(`Failed to set localStorage item "${key}":`, error);
      return false;
    }
  },

  getItem: (key: string) => {
    try {
      return secureStorage.getItem(key);
    } catch (error) {
      console.error(`Failed to get localStorage item "${key}":`, error);
      // Try to clean up corrupted entry
      try {
        localStorage.removeItem(key);
      } catch (cleanupError) {
        console.error(`Failed to cleanup corrupted localStorage item "${key}":`, cleanupError);
      }
      return null;
    }
  },

  removeItem: (key: string) => {
    try {
      return secureStorage.removeItem(key);
    } catch (error) {
      console.error(`Failed to remove localStorage item "${key}":`, error);
      return false;
    }
  }
};

// Secure localStorage wrapper for onboarding data
export const onboardingStorage = {
  save: (step: number, data: any) => {
    safeLocalStorage.setItem('onboarding_data', { step, data }, 24); // 24 hour expiration
  },

  restore: () => {
    return safeLocalStorage.getItem('onboarding_data');
  },

  clear: () => {
    safeLocalStorage.removeItem('onboarding_data');
  }
};

// Secure localStorage wrapper for consent data
export const consentStorage = {
  save: (consent: any) => {
    safeLocalStorage.setItem('cookie_consent', consent, 8760); // 1 year expiration
  },

  restore: () => {
    return safeLocalStorage.getItem('cookie_consent');
  },

  clear: () => {
    safeLocalStorage.removeItem('cookie_consent');
  }
};

// Clear all expired data on app load - with enhanced error handling
export const clearExpiredData = () => {
  try {
    secureStorage.clearExpired();
  } catch (error) {
    console.error('Failed to clear expired localStorage data:', error);
    // Fallback: Try to clear known keys individually
    const knownKeys = ['onboarding_data', 'cookie_consent', 'i18nextLng'];
    knownKeys.forEach(key => {
      try {
        const item = localStorage.getItem(key);
        if (item) {
          // Try to parse and validate
          JSON.parse(item);
        }
      } catch (parseError) {
        console.warn(`Removing corrupted localStorage key: ${key}`);
        try {
          localStorage.removeItem(key);
        } catch (removeError) {
          console.error(`Failed to remove corrupted key ${key}:`, removeError);
        }
      }
    });
  }
};
