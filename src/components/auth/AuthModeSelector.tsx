
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import GoogleLoginButton from './GoogleLoginButton';
import EmailRegisterForm from './EmailRegisterForm';
import EmailLoginForm from './EmailLoginForm';

type AuthMode = 'login-email' | 'email-register';

const AuthModeSelector: React.FC = () => {
  const { t } = useTranslation('auth');
  const { signInWithGoogle } = useAuth();
  const [mode, setMode] = useState<AuthMode | null>(null);
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

  if (mode === 'email-register') {
    return <EmailRegisterForm onBack={() => setMode(null)} />;
  }

  if (mode === 'login-email') {
    return <EmailLoginForm onBack={() => setMode(null)} />;
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700">{t('existingUserLogin')}</p>
        <div className="grid grid-cols-2 gap-2">
          <Button 
            onClick={handleGoogleAuth}
            variant="outline"
            className="w-full"
            disabled={loading}
          >
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {loading ? 'Lädt...' : t('login.google')}
          </Button>
          <Button 
            onClick={() => setMode('login-email')}
            variant="outline"
            className="w-full"
          >
            {t('login.email')}
          </Button>
        </div>
      </div>
      
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-muted-foreground">
            {t('or')}
          </span>
        </div>
      </div>
      
      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700">{t('newUser')}</p>
        <Button 
          onClick={handleGoogleAuth}
          className="w-full"
          disabled={loading}
        >
          <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {loading ? 'Lädt...' : t('register.google')}
        </Button>
        <Button 
          onClick={() => setMode('email-register')}
          variant="outline"
          className="w-full"
        >
          {t('register.email')}
        </Button>
      </div>
      
      {mode && (
        <Button 
          onClick={() => setMode(null)}
          variant="ghost"
          className="w-full"
        >
          {t('back')}
        </Button>
      )}
    </div>
  );
};

export default AuthModeSelector;
