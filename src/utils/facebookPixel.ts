
// Facebook Pixel dynamisches Loading mit Consent-Management
declare global {
  interface Window {
    fbq: any;
    _fbq: any;
  }
}

export interface FacebookPixelOptions {
  pixelId: string;
  autoPageView?: boolean;
  debug?: boolean;
}

export function loadFacebookPixel(options: FacebookPixelOptions): Promise<void> {
  return new Promise((resolve, reject) => {
    const { pixelId, autoPageView = true, debug = false } = options;
    
    // Prüfe ob Pixel-ID vorhanden ist
    if (!pixelId) {
      console.warn('Facebook Pixel ID fehlt – Tracking wird nicht aktiviert.');
      reject(new Error('Facebook Pixel ID missing'));
      return;
    }

    // Prüfe ob Pixel bereits geladen ist
    if (window.fbq) {
      console.log('Facebook Pixel bereits geladen');
      resolve();
      return;
    }

    try {
      // Facebook Pixel Script dynamisch laden (IIFE mit 7 Argumenten - die letzten 3 auf undefined)
      (function(f: any, b: Document, e: string, v: string, n?: any, t?: HTMLScriptElement, s?: HTMLScriptElement) {
        if (f.fbq) return;
        n = f.fbq = function() {
          n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
        };
        if (!f._fbq) f._fbq = n;
        n.push = n;
        n.loaded = !0;
        n.version = '2.0';
        n.queue = [];
        t = b.createElement(e) as HTMLScriptElement;
        t.async = !0;
        t.src = v;
        s = b.getElementsByTagName(e)[0] as HTMLScriptElement;
        s.parentNode!.insertBefore(t, s);
        
        // Resolve Promise wenn Script geladen ist
        t.onload = () => {
          console.log('✅ Facebook Pixel Script geladen');
          resolve();
        };
        
        t.onerror = () => {
          console.error('❌ Facebook Pixel Script Ladefehler');
          reject(new Error('Facebook Pixel script failed to load'));
        };
      })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js', undefined, undefined, undefined);

      // Pixel initialisieren
      window.fbq('init', pixelId);
      
      // Debug-Modus aktivieren falls gewünscht
      if (debug) {
        window.fbq('debug');
      }
      
      // Automatisches PageView-Event senden
      if (autoPageView) {
        window.fbq('track', 'PageView');
        console.log('🎯 Facebook Pixel PageView Event gesendet');
      }
      
    } catch (error) {
      console.error('Facebook Pixel Initialisierung fehlgeschlagen:', error);
      reject(error);
    }
  });
}

export function removeFacebookPixel(): void {
  // Pixel-Scripts entfernen (Browser-Reload empfohlen für vollständige Bereinigung)
  const scripts = document.querySelectorAll('script[src*="facebook.net"]');
  scripts.forEach(script => script.remove());
  
  // Global Objects bereinigen
  if (window.fbq) {
    delete window.fbq;
  }
  if (window._fbq) {
    delete window._fbq;
  }
  
  console.log('🧹 Facebook Pixel entfernt - Reload empfohlen für vollständige Bereinigung');
}

// Helper für Event-Tracking
export function trackFacebookEvent(eventName: string, eventData?: any): void {
  if (window.fbq) {
    window.fbq('track', eventName, eventData);
    console.log(`🎯 Facebook Event "${eventName}" gesendet:`, eventData);
  } else {
    console.warn('Facebook Pixel nicht geladen - Event kann nicht gesendet werden');
  }
}

// Standard-Events als Helper-Funktionen
export const FacebookEvents = {
  lead: (leadData?: any) => trackFacebookEvent('Lead', leadData),
  purchase: (value: number, currency: string = 'EUR') => 
    trackFacebookEvent('Purchase', { value, currency }),
  contact: () => trackFacebookEvent('Contact'),
  registration: (method?: string) => 
    trackFacebookEvent('CompleteRegistration', { method }),
  search: (searchTerm: string) => 
    trackFacebookEvent('Search', { search_string: searchTerm }),
  viewContent: (contentName?: string) => 
    trackFacebookEvent('ViewContent', { content_name: contentName })
};
