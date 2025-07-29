
import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Cookie, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { loadFacebookPixel, removeFacebookPixel } from '@/utils/facebookPixel';
import { supabase } from '@/integrations/supabase/client';

const CookieConsentBanner: React.FC = () => {
  const { t } = useTranslation('common');
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [facebookPixelId, setFacebookPixelId] = useState<string | null>(null);
  const facebookPixelInitialized = useRef(false);

  const isDebugMode = import.meta.env.DEV;

  useEffect(() => {
    // Check if consent has already been given
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      // Show banner after 1.5 seconds for better UX
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
    // Don't auto-initialize Facebook Pixel anymore - only on user action
  }, []);

  const initializeFacebookPixel = async () => {
    // Prevent multiple initializations
    if (facebookPixelInitialized.current) {
      console.log('🔄 Facebook Pixel bereits initialisiert - überspringe');
      return;
    }
    
    // Get Facebook Pixel ID when needed
    const defaultPixelId = "9151671744940732"; // Your actual pixel ID
    setFacebookPixelId(defaultPixelId);
    
    if (!defaultPixelId) {
      console.warn('Facebook Pixel ID nicht verfügbar');
      return;
    }

    try {
      await loadFacebookPixel({
        pixelId: defaultPixelId,
        autoPageView: true,
        debug: isDebugMode
      });
      facebookPixelInitialized.current = true;
      console.log('✅ Facebook Pixel erfolgreich initialisiert (einmalig)');
    } catch (error) {
      console.error('❌ Facebook Pixel Initialisierung fehlgeschlagen:', error);
    }
  };

  const updateGoogleConsent = (consentType: 'granted' | 'denied') => {
    if (typeof window !== 'undefined' && window.gtag) {
      // Update Google Consent Mode v2 IMMEDIATELY
      window.gtag('consent', 'update', {
        'ad_storage': consentType,
        'ad_user_data': consentType,
        'ad_personalization': consentType,
        'analytics_storage': consentType,
        'functionality_storage': consentType,
        'personalization_storage': consentType
      });

      // If consent granted, re-configure GA4 with full features
      if (consentType === 'granted') {
        window.gtag('config', 'G-0R0Y9QT6JK', {
          'anonymize_ip': false,
          'allow_google_signals': true,
          'allow_ad_personalization_signals': true
        });
      } else {
        // If denied, ensure privacy-first configuration
        window.gtag('config', 'G-0R0Y9QT6JK', {
          'anonymize_ip': true,
          'allow_google_signals': false,
          'allow_ad_personalization_signals': false
        });
      }
    }
  };

  const handleFacebookConsent = async (consentGiven: boolean) => {
    if (consentGiven) {
      // Consent erteilt - Facebook Pixel laden
      await initializeFacebookPixel();
    } else {
      // Consent verweigert - Facebook Pixel entfernen
      removeFacebookPixel();
    }
  };

  const closeBanner = () => {
    setIsVisible(false);
    setShowDetails(false);
  };

  const handleAccept = async () => {
    // Update consent BEFORE localStorage to prevent race conditions
    updateGoogleConsent('granted');
    await handleFacebookConsent(true);
    
    // Store consent decision
    localStorage.setItem('cookieConsent', 'accepted');
    localStorage.setItem('cookieConsentDate', new Date().toISOString());
    
    console.log('✅ Consent erteilt - Google & Facebook Tracking aktiviert');
    closeBanner();
  };

  const handleDecline = async () => {
    // Update consent BEFORE localStorage to prevent race conditions
    updateGoogleConsent('denied');
    await handleFacebookConsent(false);
    
    // Store consent decision
    localStorage.setItem('cookieConsent', 'declined');
    localStorage.setItem('cookieConsentDate', new Date().toISOString());
    
    console.log('❌ Consent verweigert - Tracking deaktiviert');
    closeBanner();
  };

  const handleSettings = () => {
    setShowDetails(!showDetails);
  };

  // Only render if visible - no backdrop when hidden
  if (!isVisible) return null;

  return (
    <>
      {/* Backdrop - only when banner is visible - Z-INDEX: 60 */}
      <div className="fixed inset-0 bg-black/20 z-[60]" />
      
      {/* Cookie Banner - Z-INDEX: 61 (above backdrop) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-[61] p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-start gap-4">
            <Cookie className="w-6 h-6 text-gray-600 mt-1 flex-shrink-0" />
            
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-2">
                {t('cookieConsent.title', 'Cookie-Einstellungen')}
              </h3>
              
              <p className="text-gray-600 text-sm mb-4">
                {t('cookieConsent.description', 'Wir verwenden Cookies und ähnliche Technologien, um Ihre Erfahrung zu verbessern und unsere Website zu analysieren. Mit Ihrer Zustimmung können wir anonyme Nutzungsstatistiken sammeln, um unsere Dienstleistungen zu verbessern.')}
              </p>

              {showDetails && (
                <div className="bg-gray-50 p-4 rounded-lg mb-4 text-sm">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    {t('cookieConsent.detailsTitle', 'Cookie-Details')}
                  </h4>
                  <div className="space-y-2 text-gray-600">
                    <div>
                      <strong>{t('cookieConsent.essential', 'Erforderliche Cookies')}:</strong>{' '}
                      {t('cookieConsent.essentialDesc', 'Diese Cookies sind für die Grundfunktionen der Website erforderlich.')}
                    </div>
                    <div>
                      <strong>{t('cookieConsent.analytics', 'Analytics-Cookies')}:</strong>{' '}
                      {t('cookieConsent.analyticsDesc', 'Google Analytics hilft uns zu verstehen, wie Besucher unsere Website nutzen (anonymisiert).')}
                    </div>
                    <div>
                      <strong>Facebook Pixel:</strong>{' '}
                      Meta/Facebook Pixel für Conversion-Tracking und Werbeanzeigen-Optimierung (nur mit Zustimmung).
                    </div>
                    <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
                      <strong>Consent-First-Approach:</strong> Kein Tracking ohne explizite Zustimmung. Vollständige DSGVO-Compliance.
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  onClick={handleAccept}
                  className="bg-black text-white hover:bg-gray-800"
                >
                  {t('cookieConsent.acceptAll', 'Alle akzeptieren')}
                </Button>
                
                <Button 
                  onClick={handleDecline}
                  variant="outline"
                  className="border-gray-300"
                >
                  {t('cookieConsent.declineAll', 'Alle ablehnen')}
                </Button>
                
                <Button 
                  onClick={handleSettings}
                  variant="ghost"
                  className="text-gray-600"
                >
                  {showDetails ? 
                    t('cookieConsent.hideDetails', 'Details ausblenden') : 
                    t('cookieConsent.showDetails', 'Details anzeigen')
                  }
                </Button>
              </div>

              <p className="text-xs text-gray-500 mt-3">
                {t('cookieConsent.moreInfo', 'Weitere Informationen finden Sie in unserer')}{' '}
                <a href="/datenschutz" className="underline hover:text-gray-700">
                  {t('cookieConsent.privacyPolicy', 'Datenschutzerklärung')}
                </a>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CookieConsentBanner;
