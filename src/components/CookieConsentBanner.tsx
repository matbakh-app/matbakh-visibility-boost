
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Cookie, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CookieConsentBanner: React.FC = () => {
  const { t } = useTranslation('common');
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

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
  }, []);

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

  const closeBanner = () => {
    setIsVisible(false);
    setShowDetails(false); // Reset details state when closing
  };

  const handleAccept = () => {
    // Update consent BEFORE localStorage to prevent race conditions
    updateGoogleConsent('granted');
    
    // Store consent decision
    localStorage.setItem('cookieConsent', 'accepted');
    localStorage.setItem('cookieConsentDate', new Date().toISOString());
    
    console.log('✅ Google Consent Mode v2: All consent types GRANTED');
    closeBanner();
  };

  const handleDecline = () => {
    // Update consent BEFORE localStorage to prevent race conditions
    updateGoogleConsent('denied');
    
    // Store consent decision
    localStorage.setItem('cookieConsent', 'declined');
    localStorage.setItem('cookieConsentDate', new Date().toISOString());
    
    console.log('❌ Google Consent Mode v2: All consent types DENIED');
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
                    <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
                      <strong>Google Consent Mode v2:</strong> Unsere Website verwendet Google's neueste Consent-Technologie für maximalen Datenschutz und Compliance.
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
