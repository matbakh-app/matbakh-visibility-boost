
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Trans } from 'react-i18next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import EmailLoginForm from './EmailLoginForm';
import EmailRegisterForm from './EmailRegisterForm';
import GoogleLoginButton from './GoogleLoginButton';
import FacebookLoginButton from './FacebookLoginButton';

const AuthTabsContainer: React.FC = () => {
  const { t, ready, i18n } = useTranslation('auth');
  const { signInWithGoogle, signInWithFacebook } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debug i18n
  React.useEffect(() => {
    console.log('AuthTabsContainer i18n:', {
      ready,
      language: i18n.language,
      tabsLogin: t('tabs.login'),
      tabsRegister: t('tabs.register'),
      ctaNotice: t('google.ctaNotice')
    });
  }, [ready, i18n, t]);

  // Warten bis i18n vollständig geladen ist
  if (!ready || !i18n.isInitialized) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="text-sm text-gray-500">Loading...</div>
      </div>
    );
  }

  const handleGoogleAuth = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setError(t('messages.googleAuthError'));
    } finally {
      setLoading(false);
    }
  };

  const handleFacebookAuth = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithFacebook();
    } catch (err: any) {
      setError(t('messages.facebookAuthError'));
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = () => {
    navigate('/password-reset');
  };

  // Fallback-Texte
  const fallbackTexts = {
    login: 'Anmelden',
    register: 'Registrieren',
    ctaNotice: 'Oder melden Sie sich an mit:',
    or: 'oder',
    forgotPassword: 'Passwort vergessen?'
  };

  return (
    <div className="w-full max-w-md space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="login" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login">
            {t('tabs.login') !== 'tabs.login' ? t('tabs.login') : fallbackTexts.login}
          </TabsTrigger>
          <TabsTrigger value="register">
            {t('tabs.register') !== 'tabs.register' ? t('tabs.register') : fallbackTexts.register}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="login" className="space-y-4 mt-6">
          <EmailLoginForm onBack={() => {}} />
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-muted-foreground">
                {t('separators.or') !== 'separators.or' ? t('separators.or') : fallbackTexts.or}
              </span>
            </div>
          </div>

          {/* CTA Notice */}
          <div className="text-center mb-4">
            <p className="text-sm text-gray-600">
              {t('google.ctaNotice') !== 'google.ctaNotice' ? t('google.ctaNotice') : fallbackTexts.ctaNotice}
            </p>
          </div>

          <GoogleLoginButton onGoogleAuth={handleGoogleAuth} loading={loading} />
          
          <FacebookLoginButton onFacebookAuth={handleFacebookAuth} loading={loading} />

          <div className="text-center">
            <button
              type="button"
              onClick={handlePasswordReset}
              className="text-sm text-muted-foreground hover:text-primary underline"
            >
              {t('form.forgotPassword') !== 'form.forgotPassword' ? t('form.forgotPassword') : fallbackTexts.forgotPassword}
            </button>
          </div>
        </TabsContent>

        <TabsContent value="register" className="space-y-4 mt-6">
          <EmailRegisterForm onBack={() => {}} />
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-muted-foreground">
                {t('separators.or') !== 'separators.or' ? t('separators.or') : fallbackTexts.or}
              </span>
            </div>
          </div>

          {/* CTA Notice */}
          <div className="text-center mb-4">
            <p className="text-sm text-gray-600">
              {t('google.ctaNotice') !== 'google.ctaNotice' ? t('google.ctaNotice') : fallbackTexts.ctaNotice}
            </p>
          </div>

          <GoogleLoginButton onGoogleAuth={handleGoogleAuth} loading={loading} />
          
          <FacebookLoginButton onFacebookAuth={handleFacebookAuth} loading={loading} />
        </TabsContent>
      </Tabs>

      {/* Legal Notice mit Trans component für klickbare Links */}
      <div className="text-xs text-gray-500 mt-6 text-center leading-relaxed">
        <Trans
          i18nKey="terms.acceptTerms"
          ns="auth"
          components={[
            <span key="0" />,
            <a key="1" href="/legal/terms" className="underline hover:text-primary" />,
            <span key="2" />,
            <a key="3" href="/legal/privacy" className="underline hover:text-primary" />
          ]}
        />
      </div>
    </div>
  );
};

export default AuthTabsContainer;
