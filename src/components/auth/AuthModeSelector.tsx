import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import GoogleLoginButton from './GoogleLoginButton';
import GoogleRegisterButton from './GoogleRegisterButton';
import EmailRegisterForm from './EmailRegisterForm';

type AuthMode = 'login' | 'google-register' | 'email-register';

const AuthModeSelector: React.FC = () => {
  const { t } = useTranslation('auth');
  const [mode, setMode] = useState<AuthMode | null>(null);

  if (mode === 'email-register') {
    return <EmailRegisterForm onBack={() => setMode(null)} />;
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-center text-2xl">
          {t('businessLogin')}
        </CardTitle>
        <p className="text-center text-gray-600">
          {t('selectAuthMethod')}
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {mode === 'login' && <GoogleLoginButton />}
        {mode === 'google-register' && <GoogleRegisterButton />}
        
        {!mode && (
          <>
            <Button 
              onClick={() => setMode('login')}
              variant="outline"
              className="w-full"
            >
              {t('existingUserLogin')}
            </Button>
            
            <Button 
              onClick={() => setMode('google-register')}
              className="w-full"
            >
              {t('newUserGoogleRegister')}
            </Button>
            
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
            
            <Button 
              onClick={() => setMode('email-register')}
              variant="outline"
              className="w-full"
            >
              {t('registerWithEmail')}
            </Button>
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