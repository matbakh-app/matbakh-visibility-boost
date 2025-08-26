import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAnalyticsEvent } from '@/hooks/useAnalyticsEvent';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, XCircle, Clock, Home, RefreshCw } from 'lucide-react';

type VCResultStatus = 'success' | 'expired' | 'invalid';

export default function VCResult() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation('vc_result');
  const { trackEvent } = useAnalyticsEvent();
  const [isSimpleMode, setIsSimpleMode] = useState(false);

  // Determine status from URL parameters
  const getStatus = (): VCResultStatus => {
    const token = searchParams.get('t');
    const error = searchParams.get('e');
    
    if (error === 'expired') return 'expired';
    if (error === 'invalid') return 'invalid';
    if (token) return 'success';
    
    // Fallback heuristic - if no token and no error, assume invalid
    return 'invalid';
  };

  const [status] = useState<VCResultStatus>(getStatus);

  // Track page view on mount
  useEffect(() => {
    trackEvent('vc_result_view', { status });
    
    // If success, trigger background report starting event
    if (status === 'success') {
      trackEvent('vc_report_starting', { 
        token: searchParams.get('t'),
        timestamp: new Date().toISOString()
      });
    }
  }, [status, trackEvent, searchParams]);

  const handleRetryClick = () => {
    trackEvent('cta_retry_click', { status });
    // Navigate to VC start form
    navigate('/visibility-check');
  };

  const handleHomeClick = () => {
    trackEvent('cta_home_click', { status });
    navigate('/');
  };

  const toggleSimpleMode = () => {
    setIsSimpleMode(!isSimpleMode);
  };

  const getStatusConfig = () => {
    const suffix = isSimpleMode ? '_simple' : '';
    
    switch (status) {
      case 'success':
        return {
          icon: <CheckCircle className="w-16 h-16 text-green-500" />,
          title: t(`success.title${suffix}`),
          body: t(`success.body${suffix}`),
          primaryCta: {
            text: t('cta.home'),
            action: handleHomeClick,
            variant: 'default' as const
          },
          showProgressHint: true
        };
      case 'expired':
        return {
          icon: <Clock className="w-16 h-16 text-orange-500" />,
          title: t(`expired.title${suffix}`),
          body: t(`expired.body${suffix}`),
          primaryCta: {
            text: t('cta.retry'),
            action: handleRetryClick,
            variant: 'default' as const
          },
          showProgressHint: false
        };
      case 'invalid':
        return {
          icon: <XCircle className="w-16 h-16 text-red-500" />,
          title: t(`invalid.title${suffix}`),
          body: t(`invalid.body${suffix}`),
          primaryCta: {
            text: t('cta.retry'),
            action: handleRetryClick,
            variant: 'default' as const
          },
          showProgressHint: false
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Simple Mode Toggle - Always Visible */}
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
            {/* Status Icon */}
            <div className="flex justify-center mb-6">
              {config.icon}
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              {config.title}
            </h1>

            {/* Body Text */}
            <p className="text-gray-600 mb-6 leading-relaxed">
              {config.body}
            </p>

            {/* Progress Hint for Success */}
            {config.showProgressHint && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-6">
                <p className="text-green-700 text-sm font-medium">
                  {t('success.progress_hint')}
                </p>
              </div>
            )}

            {/* Primary CTA - Single Button */}
            <div className="space-y-3">
              <Button
                onClick={config.primaryCta.action}
                variant={config.primaryCta.variant}
                size="lg"
                className="w-full"
              >
                {status === 'success' ? (
                  <Home className="w-4 h-4 mr-2" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                {config.primaryCta.text}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Language Indicator */}
        <div className="text-center mt-4">
          <span className="text-xs text-gray-500">
            {i18n.language.toUpperCase()}
          </span>
        </div>
      </div>
    </div>
  );
}