
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Shield, Cookie } from 'lucide-react';

interface ConsentBannerProps {
  partnerId?: string;
  onConsentGiven?: (consents: Record<string, boolean>) => void;
}

export const ConsentBanner: React.FC<ConsentBannerProps> = ({ 
  partnerId, 
  onConsentGiven 
}) => {
  const { t } = useTranslation('common');
  const [isVisible, setIsVisible] = useState(false);
  const [consents, setConsents] = useState({
    necessary: true, // Always true, cannot be changed
    analytics: false,
    facebook_conversions: false,
    marketing: false
  });

  useEffect(() => {
    // Check if consent has already been given
    const existingConsent = localStorage.getItem('userConsent');
    if (!existingConsent) {
      setIsVisible(true);
    }
  }, []);

  const handleConsentChange = (consentType: string, value: boolean) => {
    if (consentType === 'necessary') return; // Cannot change necessary cookies
    
    setConsents(prev => ({
      ...prev,
      [consentType]: value
    }));
  };

  const saveConsent = async () => {
    try {
      // Get current user if logged in
      const { data: { user } } = await supabase.auth.getUser();
      
      // Save each consent type
      for (const [consentType, consentGiven] of Object.entries(consents)) {
        if (consentType === 'necessary') continue; // Skip necessary cookies
        
        await supabase.from('user_consent_tracking').insert({
          user_id: user?.id || null,
          partner_id: partnerId || null,
          consent_type: consentType,
          consent_given: consentGiven,
          ip_address: null, // Will be filled server-side if needed
          user_agent: navigator.userAgent,
          consent_method: 'consent_banner'
        });
      }

      // Store in localStorage for quick access
      localStorage.setItem('userConsent', JSON.stringify({
        ...consents,
        timestamp: new Date().toISOString()
      }));

      // Update Google Consent Mode if available
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('consent', 'update', {
          'analytics_storage': consents.analytics ? 'granted' : 'denied',
          'ad_storage': consents.marketing ? 'granted' : 'denied',
          'ad_user_data': consents.facebook_conversions ? 'granted' : 'denied',
          'ad_personalization': consents.marketing ? 'granted' : 'denied'
        });
      }

      setIsVisible(false);
      onConsentGiven?.(consents);
    } catch (error) {
      console.error('Error saving consent:', error);
    }
  };

  const acceptAll = () => {
    const allConsents = {
      necessary: true,
      analytics: true,
      facebook_conversions: true,
      marketing: true
    };
    setConsents(allConsents);
    
    // Save immediately
    setTimeout(() => {
      saveConsent();
    }, 100);
  };

  const rejectAll = () => {
    const minimalConsents = {
      necessary: true,
      analytics: false,
      facebook_conversions: false,
      marketing: false
    };
    setConsents(minimalConsents);
    
    // Save immediately
    setTimeout(() => {
      saveConsent();
    }, 100);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Datenschutz & Cookies
          </CardTitle>
          <CardDescription>
            Wir respektieren Ihre Privatsphäre und geben Ihnen die Kontrolle über Ihre Daten.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="necessary" 
                checked={consents.necessary} 
                disabled 
              />
              <label htmlFor="necessary" className="text-sm font-medium">
                Notwendige Cookies (erforderlich)
              </label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="analytics" 
                checked={consents.analytics}
                onCheckedChange={(checked) => handleConsentChange('analytics', checked as boolean)}
              />
              <label htmlFor="analytics" className="text-sm">
                Analytics (Google Analytics für Website-Verbesserungen)
              </label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="facebook_conversions" 
                checked={consents.facebook_conversions}
                onCheckedChange={(checked) => handleConsentChange('facebook_conversions', checked as boolean)}
              />
              <label htmlFor="facebook_conversions" className="text-sm">
                Facebook Conversions (Erfolgs-Tracking für Werbeanzeigen)
              </label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="marketing" 
                checked={consents.marketing}
                onCheckedChange={(checked) => handleConsentChange('marketing', checked as boolean)}
              />
              <label htmlFor="marketing" className="text-sm">
                Marketing Cookies (Personalisierte Werbung)
              </label>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={acceptAll} className="flex-1">
              Alle akzeptieren
            </Button>
            <Button onClick={rejectAll} variant="outline" className="flex-1">
              Nur notwendige
            </Button>
            <Button onClick={saveConsent} variant="secondary" className="flex-1">
              Auswahl speichern
            </Button>
          </div>

          <p className="text-xs text-gray-500">
            Weitere Informationen finden Sie in unserer{' '}
            <a href="/datenschutz" className="underline">Datenschutzerklärung</a>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
