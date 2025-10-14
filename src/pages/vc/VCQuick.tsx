import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, CheckCircle, AlertCircle, Loader2, ToggleLeft, ToggleRight, Bug } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { startVisibilityCheck, getVCEnvironmentInfo } from '@/services/vc';
import { useAnalyticsEvent } from '@/hooks/useAnalyticsEvent';

// Form validation schema
const formSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().optional(),
  consentPrivacy: z.boolean().refine(val => val === true, {
    message: 'Privacy consent is required'
  }),
  consentMarketing: z.boolean().optional()
});

type FormData = z.infer<typeof formSchema>;

type UIState = 'idle' | 'loading' | 'success' | 'error';

export default function VCQuick() {
  const { t, i18n } = useTranslation(['vc_quick', 'vc_microcopy']);
  const { trackEvent } = useAnalyticsEvent();
  
  // postMessage helper for iframe embedding
  const sendMessage = (message: unknown) => {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage(message, '*');
    }
  };
  const [uiState, setUiState] = useState<UIState>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isSimpleMode, setIsSimpleMode] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      consentPrivacy: false,
      consentMarketing: false
    }
  });

  const consentPrivacy = watch('consentPrivacy');
  const consentMarketing = watch('consentMarketing');

  // Track page view on mount & send ready message
  React.useEffect(() => {
    trackEvent('vc_quick_view', { 
      locale: i18n.language,
      simple_mode: isSimpleMode 
    });
    
    // Send ready message for iframe embedding
    sendMessage({ type: 'vc:ready' });
  }, [trackEvent, i18n.language, isSimpleMode]);

  // Send height updates for iframe embedding
  React.useLayoutEffect(() => {
    const updateHeight = () => {
      const height = document.body.scrollHeight;
      sendMessage({ type: 'vc:height', value: height });
    };
    
    updateHeight();
    const interval = setInterval(updateHeight, 400);
    
    return () => clearInterval(interval);
  }, []);

  const onSubmit = async (data: FormData) => {
    setUiState('loading');
    setErrorMessage('');

    // Send submit message for iframe embedding
    sendMessage({ 
      type: 'vc:submit', 
      payload: { 
        name: data.name, 
        email: data.email 
      } 
    });

    trackEvent('vc_quick_submit', {
      locale: i18n.language,
      has_name: !!data.name,
      marketing_consent: data.consentMarketing || false,
      simple_mode: isSimpleMode
    });

    try {
      const result = await startVisibilityCheck(
        data.email,
        data.name,
        data.consentMarketing || false,
        i18n.language as 'de' | 'en'
      );

      if (result.ok) {
        setUiState('success');
        
        // Send success message for iframe embedding
        sendMessage({ 
          type: 'vc:success', 
          payload: { 
            token: result.token,
            score: result.score || 0
          } 
        });
        
        trackEvent('vc_quick_success', {
          locale: i18n.language,
          token_received: !!result.token
        });
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (error: unknown) {
      setUiState('error');
      
      // Map error codes to microcopy keys
      let errorKey = 'identify.error.server';
      let errorCode = 'unknown';
      
      if (error instanceof Error) {
        if ('code' in error) {
          errorCode = (error as Error & { code: string }).code;
          switch (errorCode) {
            case 'NETWORK_ERROR':
              errorKey = 'identify.error.server';
              break;
            case 'RATE_LIMITED':
              errorKey = 'identify.error.rateLimit';
              break;
            case 'VALIDATION_ERROR':
              errorKey = 'identify.error.validation';
              break;
            case 'NO_CANDIDATES':
              errorKey = 'identify.error.noCandidates';
              break;
            case 'AMBIGUOUS':
              errorKey = 'identify.error.ambiguous';
              break;
            default:
              errorKey = 'identify.error.server';
          }
        }
      }
      
      const errorMessage = t(errorKey, { ns: 'vc_microcopy' });
      setErrorMessage(errorMessage);
      
      // Send error message for iframe embedding
      sendMessage({ 
        type: 'vc:error', 
        payload: { 
          code: errorCode,
          detail: errorMessage
        } 
      });
      
      trackEvent('vc_quick_error', {
        error_code: errorCode,
        error_message: error instanceof Error ? error.message : 'Unknown error',
        locale: i18n.language
      });
    }
  };

  const handleConsentMarketingToggle = () => {
    const newValue = !consentMarketing;
    setValue('consentMarketing', newValue);
    
    trackEvent('vc_quick_consent_marketing_toggle', {
      enabled: newValue,
      locale: i18n.language
    });
  };

  // Dev-only test functions
  const handleTestSuccess = () => {
    setUiState('success');
    trackEvent('vc_quick_test', { action: 'simulate_success' });
  };

  const handleTestInvalid = () => {
    trackEvent('vc_quick_test', { action: 'simulate_invalid' });
    window.location.href = '/vc/result?e=invalid';
  };

  const handleTestExpired = () => {
    trackEvent('vc_quick_test', { action: 'simulate_expired' });
    window.location.href = '/vc/result?e=expired';
  };

  const handleTestNetworkError = () => {
    setUiState('error');
    const suffix = isSimpleMode ? '_simple' : '';
    setErrorMessage(t(`error_network${suffix}`));
    trackEvent('vc_quick_test', { action: 'simulate_network_error' });
  };

  const toggleSimpleMode = () => {
    setIsSimpleMode(!isSimpleMode);
    trackEvent('vc_quick_simple_toggle', {
      enabled: !isSimpleMode,
      locale: i18n.language
    });
  };

  const suffix = isSimpleMode ? '_simple' : '';
  const envInfo = getVCEnvironmentInfo();
  const showTestMode = import.meta.env.DEV && import.meta.env.VITE_VC_UI_TEST_MODE === 'true';

  if (uiState === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="shadow-lg">
            <CardContent className="p-8 text-center">
              <div className="flex justify-center mb-6">
                <CheckCircle className="w-16 h-16 text-green-500" />
              </div>
              
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                {t(`success_title${suffix}`)}
              </h1>
              
              <p className="text-gray-600 mb-6 leading-relaxed">
                {t(`success_message${suffix}`)}
              </p>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <p className="text-green-700 text-sm">
                  💡 {isSimpleMode ? 'Tipp: Auch Spam-Ordner prüfen!' : 'Tipp: Falls die E-Mail nicht ankommt, prüfen Sie auch Ihren Spam-Ordner.'}
                </p>
              </div>
              
              <Button
                onClick={() => window.location.href = '/vc/quick'}
                variant="outline"
                className="w-full"
              >
                Neuen Check starten
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Simple Mode Toggle */}
        <div className="flex justify-end mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSimpleMode}
            className="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-2"
          >
            {isSimpleMode ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
            {t(`toggle.${isSimpleMode ? 'normal' : 'simple'}`)}
          </Button>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <Mail className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              {t(`title${suffix}`)}
            </CardTitle>
            <p className="text-gray-600 mt-2">
              {t(`subtitle${suffix}`)}
            </p>
          </CardHeader>

          <CardContent className="p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  {t('identify.fields.email', { ns: 'vc_microcopy' })}
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t('identify.fields.email', { ns: 'vc_microcopy' })}
                  {...register('email')}
                  className={errors.email ? 'border-red-500' : ''}
                  disabled={uiState === 'loading'}
                />
                {errors.email && (
                  <p className="text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              {/* Name Field (Optional) */}
              {!isSimpleMode && (
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium text-gray-600">
                    {t('identify.fields.name', { ns: 'vc_microcopy' })}
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder={t('identify.help.name', { ns: 'vc_microcopy' })}
                    {...register('name')}
                    disabled={uiState === 'loading'}
                  />
                </div>
              )}

              {/* Privacy Consent */}
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="consentPrivacy"
                    checked={consentPrivacy}
                    onCheckedChange={(checked) => setValue('consentPrivacy', !!checked)}
                    disabled={uiState === 'loading'}
                    className={errors.consentPrivacy ? 'border-red-500' : ''}
                  />
                  <Label htmlFor="consentPrivacy" className="text-sm leading-relaxed cursor-pointer">
                    {t(`consent_privacy${suffix}`)} {' '}
                    <a 
                      href={i18n.language === 'de' ? '/datenschutz' : '/privacy'} 
                      target="_blank" 
                      className="text-blue-600 hover:underline"
                    >
                      {t('privacy_link_text')}
                    </a>
                  </Label>
                </div>
                {errors.consentPrivacy && (
                  <p className="text-sm text-red-600 ml-6">{errors.consentPrivacy.message}</p>
                )}
              </div>

              {/* Marketing Consent */}
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="consentMarketing"
                  checked={consentMarketing}
                  onCheckedChange={handleConsentMarketingToggle}
                  disabled={uiState === 'loading'}
                />
                <Label htmlFor="consentMarketing" className="text-sm leading-relaxed cursor-pointer text-gray-600">
                  {t(`consent_marketing${suffix}`)}
                </Label>
              </div>

              {/* Error Message */}
              {uiState === 'error' && errorMessage && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                disabled={uiState === 'loading' || !consentPrivacy}
                size="lg"
              >
                {uiState === 'loading' ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('identify.btn.loading', { ns: 'vc_microcopy' })}
                  </>
                ) : (
                  t('identify.btn.primary', { ns: 'vc_microcopy' })
                )}
              </Button>
            </form>

            {/* Dev Environment Info */}
            {envInfo && (
              <div className="mt-6 p-3 bg-gray-100 rounded text-xs text-gray-600">
                <strong>Dev Info:</strong> {envInfo.provider} | {envInfo.apiBase}
              </div>
            )}

            {/* Dev-Only Test Panel */}
            {showTestMode && (
              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Bug className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800">UX Test Panel (Dev Only)</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={handleTestSuccess}
                    variant="outline"
                    size="sm"
                    className="text-xs border-green-300 text-green-700 hover:bg-green-50"
                  >
                    Simuliere Success (200)
                  </Button>
                  <Button
                    onClick={handleTestInvalid}
                    variant="outline"
                    size="sm"
                    className="text-xs border-red-300 text-red-700 hover:bg-red-50"
                  >
                    Simuliere Invalid
                  </Button>
                  <Button
                    onClick={handleTestExpired}
                    variant="outline"
                    size="sm"
                    className="text-xs border-orange-300 text-orange-700 hover:bg-orange-50"
                  >
                    Simuliere Expired
                  </Button>
                  <Button
                    onClick={handleTestNetworkError}
                    variant="outline"
                    size="sm"
                    className="text-xs border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Simuliere Network Error
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}