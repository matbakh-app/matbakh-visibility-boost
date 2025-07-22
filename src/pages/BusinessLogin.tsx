
import React, { useEffect, Suspense, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AuthTabsContainer from '@/components/auth/AuthTabsContainer';
import AuthLoadingState from '@/components/auth/AuthLoadingState';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle } from 'lucide-react';

const BusinessLogin: React.FC = () => {
  const { user, loading, oauthError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, ready, i18n } = useTranslation('auth');
  const [callbackStatus, setCallbackStatus] = useState<'success' | 'error' | null>(null);

  // Debug i18n status
  useEffect(() => {
    console.log('i18n Debug:', {
      ready,
      language: i18n.language,
      isInitialized: i18n.isInitialized,
      hasResources: i18n.hasResourceBundle(i18n.language, 'auth'),
      businessLogin: t('businessLogin'),
      connectGoogleProfile: t('connectGoogleProfile')
    });
  }, [ready, i18n, t]);

  // OAuth Callback Hash (Access Token im Hash-Fragment)
  useEffect(() => {
    if (window.location.hash && window.location.hash.includes("access_token")) {
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);

      const accessToken = params.get("access_token");
      if (accessToken) {
        setCallbackStatus("success");
        window.history.replaceState(null, '', window.location.pathname);
        setTimeout(() => {
          navigate("/dashboard", { replace: true });
        }, 1200);
      }
    }
  }, [navigate]);

  // OAuth Callback Parameter Verarbeitung
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const hasError = urlParams.get('error');
    const hasCode = urlParams.get('code');
    const hasAccessToken = urlParams.get('access_token');
    
    if (hasError) {
      console.error('OAuth Callback Error:', hasError, urlParams.get('error_description'));
      setCallbackStatus('error');
    } else if (hasCode || hasAccessToken) {
      console.log('OAuth Callback Success - Code/Token received');
      setCallbackStatus('success');
    }
  }, [location.search]);

  useEffect(() => {
    if (user && !loading) {
      const from = location.state?.from?.pathname || '/partner/dashboard';
      navigate(from, { replace: true });
    }
  }, [user, loading, navigate, location.state]);

  // KRITISCH: Warten bis i18n vollständig geladen ist
  if (loading || !ready || !i18n.isInitialized) {
    return <AuthLoadingState />;
  }

  // Fallback-Texte falls i18n nicht funktioniert
  const fallbackTexts = {
    businessLogin: 'Business Partner Portal',
    connectGoogleProfile: 'Verbinden Sie Ihr Unternehmensprofil mit Google oder Facebook'
  };

  return (
    <Suspense fallback={<AuthLoadingState />}>
      <div className="min-h-screen bg-white">
        <Header />

        <main className="flex items-center justify-center min-h-[80vh] px-4">
          <div className="w-full max-w-md space-y-6 p-6 border rounded-2xl shadow-sm bg-white">
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold">
                {t('businessLogin') !== 'businessLogin' ? t('businessLogin') : fallbackTexts.businessLogin}
              </h1>
              <p className="text-sm text-gray-600">
                {t('connectGoogleProfile') !== 'connectGoogleProfile' ? t('connectGoogleProfile') : fallbackTexts.connectGoogleProfile}
              </p>
            </div>

            {/* Debug Info - nur im Development */}
            {process.env.NODE_ENV === 'development' && (
              <div className="text-xs text-red-500 bg-red-50 p-2 rounded">
                Debug: ready={ready.toString()}, lang={i18n.language}, 
                businessLogin="{t('businessLogin')}"
              </div>
            )}

            {/* OAuth Error/Success Status */}
            {oauthError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{oauthError}</AlertDescription>
              </Alert>
            )}

            {callbackStatus === 'success' && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  {t('messages.googleAuthSuccess')}
                </AlertDescription>
              </Alert>
            )}

            {callbackStatus === 'error' && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {t('messages.googleAuthError')}
                </AlertDescription>
              </Alert>
            )}

            <AuthTabsContainer />
          </div>
        </main>

        <Footer />
      </div>
    </Suspense>
  );
};

export default BusinessLogin;
