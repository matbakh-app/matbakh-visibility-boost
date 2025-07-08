import { useCallback } from 'react';

export const useAnalyticsEvent = () => {
  const trackEvent = useCallback((eventName: string, properties?: Record<string, any>) => {
    try {
      // For now, just console.log - can be extended with real analytics later
      console.log('Analytics Event:', eventName, properties);
      
      // Future: Add real analytics provider here
      // Example: analytics.track(eventName, properties);
    } catch (error) {
      console.error('Analytics tracking error:', error);
    }
  }, []);

  return { trackEvent };
};