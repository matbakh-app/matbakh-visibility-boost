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
      setError('Google Anmeldung fehlgeschlagen! Bitte versuche es erneut.');
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
          <TabsTrigger value="login">Anmelden</TabsTrigger>
          <TabsTrigger value="register">Registrieren</TabsTrigger>
        </TabsList>

        <TabsContent value="login" className="space-y-4 mt-6">
          <EmailLoginForm onBack={() => {}} />
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-muted-foreground">oder</span>
            </div>
          </div>

          <GoogleLoginButton onGoogleAuth={handleGoogleAuth} loading={loading} />

          <div className="text-center">
            <button
              type="button"
              onClick={handlePasswordReset}
              className="text-sm text-muted-foreground hover:text-primary underline"
            >
              Passwort vergessen?
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
              <span className="bg-white px-2 text-muted-foreground">oder</span>
            </div>
          </div>

          <GoogleLoginButton onGoogleAuth={handleGoogleAuth} loading={loading} />
        </TabsContent>
      </Tabs>

      <p className="text-xs text-gray-500 mt-4 text-center">
        Mit der Registrierung stimmen Sie unseren{' '}
        <a href="/legal/terms" className="underline">Nutzungsbedingungen</a> und{' '}
        <a href="/legal/privacy" className="underline">Datenschutzbestimmungen</a> zu.
      </p>
    </div>
  );
};

export default AuthTabsContainer;