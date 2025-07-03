import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import GoogleLoginButton from './GoogleLoginButton';
import GoogleRegisterButton from './GoogleRegisterButton';
import EmailRegisterForm from './EmailRegisterForm';
import EmailLoginForm from './EmailLoginForm';

type AuthMode = 'login-google' | 'login-email' | 'google-register' | 'email-register';

const AuthModeSelector: React.FC = () => {
  const { t } = useTranslation('auth');
  const [mode, setMode] = useState<AuthMode | null>(null);

  if (mode === 'email-register') {
    return <EmailRegisterForm onBack={() => setMode(null)} />;
  }

  if (mode === 'login-email') {
    return <EmailLoginForm onBack={() => setMode(null)} />;
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-center text-2xl">
          {t('login.title')}
        </CardTitle>
        <p className="text-center text-gray-600">
          {t('login.subtitle')}
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {mode === 'login-google' && <GoogleLoginButton />}
        {mode === 'google-register' && <GoogleRegisterButton />}
        
        {!mode && (
          <>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Anmeldung für bestehende Nutzer:</p>
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  onClick={() => setMode('login-google')}
                  variant="outline"
                  className="w-full"
                >
                  {t('login.google')}
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
              <p className="text-sm font-medium text-gray-700">Neuer Nutzer:</p>
              <Button 
                onClick={() => setMode('google-register')}
                className="w-full"
              >
                {t('register.google')}
              </Button>
              <Button 
                onClick={() => setMode('email-register')}
                variant="outline"
                className="w-full"
              >
                {t('register.email')}
              </Button>
            </div>
          </>
        )}
        
        {mode && (
          <Button 
            onClick={() => setMode(null)}
            variant="ghost"
            className="w-full"
          >
            {t('back')}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default AuthModeSelector;