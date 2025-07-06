
declare global {
  interface Window {
    gtag: (
      command: 'consent' | 'config' | 'event',
      target: string,
      config?: {
        analytics_storage?: 'granted' | 'denied';
        anonymize_ip?: boolean;
        [key: string]: any;
      }
    ) => void;
  }
}

export {};
