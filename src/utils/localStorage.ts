import { secureStorage } from './security';

// Secure localStorage wrapper for onboarding data
export const onboardingStorage = {
  save: (step: number, data: any) => {
    secureStorage.setItem('onboarding_data', { step, data }, 24); // 24 hour expiration
  },

  restore: () => {
    return secureStorage.getItem('onboarding_data');
  },

  clear: () => {
    secureStorage.removeItem('onboarding_data');
  }
};

// Secure localStorage wrapper for consent data
export const consentStorage = {
  save: (consent: any) => {
    secureStorage.setItem('cookie_consent', consent, 8760); // 1 year expiration
  },

  restore: () => {
    return secureStorage.getItem('cookie_consent');
  },

  clear: () => {
    secureStorage.removeItem('cookie_consent');
  }
};

// Clear all expired data on app load
export const clearExpiredData = () => {
  secureStorage.clearExpired();
};