
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useGoogleConnection } from '@/hooks/useGoogleConnection';
import { Shield, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface GoogleConnectionStepProps {
  gmailAddress?: string;
  onConnectionComplete: (data: any) => void;
  language?: 'de' | 'en';
}

export const GoogleConnectionStep: React.FC<GoogleConnectionStepProps> = ({
  gmailAddress,
  onConnectionComplete,
  language = 'de'
}) => {
  const { t } = useTranslation('onboarding');
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { data: connectionData, refetch } = useGoogleConnection();

  const handleGoogleConnect = async () => {
    setConnecting(true);
    setError(null);
    
    try {
      // Redirect to Google OAuth
      const redirectUrl = encodeURIComponent(`${window.location.origin}/partner/onboarding`);
      const scopes = [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/business.manage'
      ].join(' ');
      
      const authUrl = `https://accounts.google.com/oauth/authorize?` +
        `client_id=${process.env.GOOGLE_CLIENT_ID}&` +
        `redirect_uri=${redirectUrl}&` +
        `scope=${encodeURIComponent(scopes)}&` +
        `response_type=code&` +
        `access_type=offline&` +
        `prompt=consent`;
      
      window.location.href = authUrl;
    } catch (err) {
      setError(t('messages.connectionError'));
      setConnecting(false);
    }
  };

  const isConnected = connectionData?.isGoogleConnected;

  return (
    <div className="space-y-6">
      <Card className="border-2 border-dashed border-gray-300">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
              {isConnected ? (
                <CheckCircle className="w-8 h-8 text-green-600" />
              ) : (
                <Shield className="w-8 h-8 text-blue-600" />
              )}
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {isConnected ? t('step4.connected') : t('step4.notConnected')}
              </h3>
              <p className="text-gray-600 mt-2">
                {isConnected ? 
                  t('step4.connectionSuccess') :
                  t('step4.connectionDescription')
                }
              </p>
            </div>

            {gmailAddress && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-700">
                  <strong>{t('step3.gmailAccount')}:</strong> {gmailAddress}
                </p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 p-3 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {!isConnected && (
              <div className="space-y-3">
                <Button
                  onClick={handleGoogleConnect}
                  disabled={connecting}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  size="lg"
                >
                  {connecting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {t('step4.connecting')}
                    </>
                  ) : (
                    <>
                      <img 
                        src="https://developers.google.com/identity/images/g-logo.png" 
                        alt="Google"
                        className="w-4 h-4 mr-2"
                      />
                      {t('step4.connectButton')}
                    </>
                  )}
                </Button>
                
                <div className="text-xs text-gray-500 space-y-1">
                  <p>{t('step4.permissions.title')}</p>
                  <ul className="text-left max-w-sm mx-auto">
                    <li>• {t('step4.permissions.businessProfile')}</li>
                    <li>• {t('step4.permissions.basicInfo')}</li>
                    <li>• {t('step4.permissions.editPermissions')}</li>
                  </ul>
                </div>
              </div>
            )}

            {isConnected && (
              <Button
                onClick={() => onConnectionComplete({ google_connected: true })}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                size="lg"
              >
                {t('navigation.finishOnboarding')}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">{t('step4.nextSteps.title')}</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• {t('step4.nextSteps.setupProfile')}</li>
          <li>• {t('step4.nextSteps.transferData')}</li>
          <li>• {t('step4.nextSteps.dashboardAccess')}</li>
          <li>• {t('step4.nextSteps.autoSync')}</li>
        </ul>
      </div>
    </div>
  );
};
