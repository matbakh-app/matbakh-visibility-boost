import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import EmailLoginForm from './EmailLoginForm';
import EmailRegisterForm from './EmailRegisterForm';
import GoogleLoginButton from './GoogleLoginButton';

const AuthTabsContainer: React.FC = () => {
  const { t } = useTranslation('auth');
  const { signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handlePasswordReset = () => {
    navigate('/password-reset');
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
          <TabsTrigger value="login">{t('tabs.login')}</TabsTrigger>
          <TabsTrigger value="register">{t('tabs.register')}</TabsTrigger>
        </TabsList>

        <TabsContent value="login" className="space-y-4 mt-6">
          <EmailLoginForm onBack={() => {}} />
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-muted-foreground">{t('separators.or')}</span>
            </div>
          </div>

          <GoogleLoginButton onGoogleAuth={handleGoogleAuth} loading={loading} />

          <div className="text-center">
            <button
              type="button"
              onClick={handlePasswordReset}
              className="text-sm text-muted-foreground hover:text-primary underline"
            >
              {t('form.forgotPassword')}
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
              <span className="bg-white px-2 text-muted-foreground">{t('separators.or')}</span>
            </div>
          </div>

          <GoogleLoginButton onGoogleAuth={handleGoogleAuth} loading={loading} />
        </TabsContent>
      </Tabs>

      <p className="text-xs text-gray-500 mt-4 text-center">
        {t('terms.acceptTerms')}{' '}
        <a href="/legal/terms" className="underline">{t('terms.termsOfService')}</a> {t('terms.and')}{' '}
        <a href="/legal/privacy" className="underline">{t('terms.privacyPolicy')}</a> {t('terms.to')}
      </p>
    </div>
  );
};

export default AuthTabsContainer;