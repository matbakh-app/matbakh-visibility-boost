
/*
 * Layout-Struktur zentralisiert – keine eigenen Layout-Komponenten mehr verwenden. 
 * Änderungen nur nach Rücksprache.
 */

import React, { useEffect, Suspense, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
    console.log('BusinessLogin i18n Debug:', {
      ready,
      language: i18n.language,
      isInitialized: i18n.isInitialized,
      hasAuthResources: i18n.hasResourceBundle(i18n.language, 'auth'),
      authNamespaceLoaded: i18n.hasLoadedNamespace('auth'),
      businessLogin: t('businessLogin'),
      connectGoogleProfile: t('connectGoogleProfile'),
      availableKeys: i18n.getResourceBundle(i18n.language, 'auth')
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
          // 🔧 NUR auf Startseite weiterleiten, nicht von anderen Seiten
          const currentPath = window.location.pathname;
          if (currentPath === '/' || currentPath.includes('/login')) {
            navigate("/dashboard", { replace: true });
          } else {
            console.log('BusinessLogin: Staying on current path:', currentPath);
          }
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
      // Check for test parameter
      const urlParams = new URLSearchParams(location.search);
      const testMode = urlParams.get('test');
      
      if (testMode === '1') {
        navigate('/quick-verify', { replace: true });
        return;
      }
      
      const from = location.state?.from?.pathname || '/partner/dashboard';
      navigate(from, { replace: true });
    }
  }, [user, loading, navigate, location.state]);

  // KRITISCH: Warten bis i18n UND auth-Namespace vollständig geladen sind
  if (loading || !ready || !i18n.isInitialized || !i18n.hasLoadedNamespace('auth')) {
    return <AuthLoadingState />;
  }

  return (
    <Suspense fallback={<AuthLoadingState />}>
      <main className="flex items-center justify-center min-h-[80vh] px-4">
        <div className="w-full max-w-md space-y-6 p-6 border rounded-2xl shadow-sm bg-white">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold">
              {t('shared.businessLogin', 'Business Login')}
            </h1>
            <p className="text-sm text-gray-600">
              {t('shared.connectGoogleProfile', 'Verbinden Sie Ihr Unternehmensprofil')}
            </p>
          </div>

          {/* Debug Info - nur im Development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="text-xs text-red-500 bg-red-50 p-2 rounded">
              Debug: ready={ready.toString()}, authLoaded={i18n.hasLoadedNamespace('auth').toString()}, 
              lang={i18n.language}, businessLogin="{t('shared.businessLogin', 'Business Login')}"
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
    </Suspense>
  );
};

export default BusinessLogin;
