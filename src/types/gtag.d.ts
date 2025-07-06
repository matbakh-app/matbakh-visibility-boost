
declare global {
  interface Window {
    gtag: (
      command: 'consent' | 'config' | 'event' | 'js',
      target: string | Date | 'default' | 'update',
      config?: {
        // Consent Mode v2 parameters
        ad_storage?: 'granted' | 'denied';
        ad_user_data?: 'granted' | 'denied';
        ad_personalization?: 'granted' | 'denied';
        analytics_storage?: 'granted' | 'denied';
        functionality_storage?: 'granted' | 'denied';
        personalization_storage?: 'granted' | 'denied';
        security_storage?: 'granted' | 'denied';
        wait_for_update?: number;
        url_passthrough?: boolean;
        ads_data_redaction?: boolean;
        
        // GA4 Configuration parameters
        anonymize_ip?: boolean;
        allow_google_signals?: boolean;
        allow_ad_personalization_signals?: boolean;
        [key: string]: any;
      }
    ) => void;
  }
}

export {};
