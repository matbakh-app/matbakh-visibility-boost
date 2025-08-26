import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckCircle, AlertCircle, Mail, Loader2 } from 'lucide-react';
import { startVc, VcStartPayload } from '@/lib/vcApi';
import { useAnalyticsEvent } from '@/hooks/useAnalyticsEvent';

interface VcQuickOnboardingProps {
  className?: string;
}

export default function VcQuickOnboarding({ className }: VcQuickOnboardingProps) {
  const { t, i18n } = useTranslation('vc_quick');
  const { trackEvent } = useAnalyticsEvent();
  const [isSimpleMode, setIsSimpleMode] = useState(false);
  
  // Form state
  const [email, setEmail] = useState('');
  const [consentPrivacy, setConsentPrivacy] = useState(false);
  const [consentMarketing, setConsentMarketing] = useState(false);
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSubmitDisabled = !email.trim() || !consentPrivacy || isLoading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitDisabled) return;

    setIsLoading(true);
    setError(null);

    try {
      const payload: VcStartPayload = {
        email: email.trim(),
        name: '', // Optional, keeping empty for quick flow
        consent_privacy: true,
        consent_marketing: consentMarketing,
        locale: i18n.language as 'de' | 'en',
      };

      const response = await startVc(payload);

      if (response.ok) {
        setIsSuccess(true);
        
        // Track successful submission
        trackEvent('onb_quick_submit', {
          email_domain: email.split('@')[1] || 'unknown',
          consent_marketing: consentMarketing,
          locale: i18n.language,
        });
      } else {
        throw new Error('API returned ok: false');
      }
    } catch (err) {
      console.error('VC Quick Onboarding Error:', err);
      
      let errorCode = 'unknown';
      if (err instanceof Error) {
        if (err.message.includes('403')) {
          errorCode = 'forbidden';
          setError(isSimpleMode ? t('error_network_simple') : t('error_network'));
        } else if (err.message.includes('415')) {
          errorCode = 'unsupported_media';
          setError(isSimpleMode ? t('error_network_simple') : t('error_network'));
        } else if (err.message.includes('HTTP')) {
          errorCode = 'http_error';
          setError(isSimpleMode ? t('error_message_simple') : t('error_message'));
        } else {
          errorCode = 'network';
          setError(isSimpleMode ? t('error_network_simple') : t('error_network'));
        }
      } else {
        setError(isSimpleMode ? t('error_message_simple') : t('error_message'));
      }

      // Track error
      trackEvent('onb_quick_error', { code: errorCode });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSimpleMode = () => {
    setIsSimpleMode(!isSimpleMode);
  };

  const getPrivacyLink = () => {
    return i18n.language === 'en' ? '/privacy' : '/datenschutz';
  };

  const suffix = isSimpleMode ? '_simple' : '';

  if (isSuccess) {
    return (
      <div className={className}>
        {/* Simple Mode Toggle */}
        <div className="flex justify-end mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSimpleMode}
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            {isSimpleMode ? t('toggle.normal') : t('toggle.simple')}
          </Button>
        </div>

        <Card className="shadow-lg">
          <CardContent className="p-8 text-center">
            <div className="flex justify-center mb-6">
              <CheckCircle className="w-16 h-16 text-green-500" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {t(`success_title${suffix}`)}
            </h2>
            
            <p className="text-gray-600 mb-6 leading-relaxed">
              {t(`success_message${suffix}`)}
            </p>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-center text-green-700">
                <Mail className="w-5 h-5 mr-2" />
                <span className="text-sm font-medium">
                  ⏱ 15 Min gültig
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Simple Mode Toggle */}
      <div className="flex justify-end mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSimpleMode}
          className="text-sm text-gray-600 hover:text-gray-800"
        >
          {isSimpleMode ? t('toggle.normal') : t('toggle.simple')}
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            {t(`title${suffix}`)}
          </CardTitle>
          <p className="text-gray-600 text-center">
            {t(`subtitle${suffix}`)}
          </p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Input */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                {t('email_label')}
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('email_placeholder')}
                required
                disabled={isLoading}
                className="w-full"
              />
            </div>

            {/* Privacy Consent (Required) */}
            <div className="flex items-start space-x-3">
              <Checkbox
                id="consent-privacy"
                checked={consentPrivacy}
                onCheckedChange={(checked) => setConsentPrivacy(!!checked)}
                disabled={isLoading}
                className="mt-1"
              />
              <Label 
                htmlFor="consent-privacy" 
                className="text-sm leading-relaxed cursor-pointer"
              >
                {t(`consent_privacy${suffix}`)}{' '}
                <a 
                  href={getPrivacyLink()} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  {t('privacy_link_text')}
                </a>
              </Label>
            </div>

            {/* Marketing Consent (Optional) */}
            <div className="flex items-start space-x-3">
              <Checkbox
                id="consent-marketing"
                checked={consentMarketing}
                onCheckedChange={(checked) => setConsentMarketing(!!checked)}
                disabled={isLoading}
                className="mt-1"
              />
              <Label 
                htmlFor="consent-marketing" 
                className="text-sm leading-relaxed cursor-pointer"
              >
                {t(`consent_marketing${suffix}`)}
              </Label>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center text-red-700">
                  <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitDisabled}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t(`loading${suffix}`)}
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  {t(`submit_button${suffix}`)}
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}