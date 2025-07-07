
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useGoogleConnection } from '@/hooks/useGoogleConnection';
import { Shield, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface GoogleConnectionStepProps {
  gmailAddress?: string;
  onConnectionComplete: (data: any) => void;
}

export const GoogleConnectionStep: React.FC<GoogleConnectionStepProps> = ({
  gmailAddress,
  onConnectionComplete
}) => {
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
      setError('Fehler beim Verbinden mit Google. Bitte versuchen Sie es erneut.');
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
                {isConnected ? 'Google-Konto verbunden!' : 'Google-Konto verknüpfen'}
              </h3>
              <p className="text-gray-600 mt-2">
                {isConnected ? 
                  'Ihr Google-Konto wurde erfolgreich mit matbakh.app verknüpft.' :
                  'Verbinden Sie Ihr Google-Konto, um Ihr Business Profil automatisch zu verwalten.'
                }
              </p>
            </div>

            {gmailAddress && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-700">
                  <strong>Gmail-Adresse:</strong> {gmailAddress}
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
                      Verbinde mit Google...
                    </>
                  ) : (
                    <>
                      <img 
                        src="https://developers.google.com/identity/images/g-logo.png" 
                        alt="Google"
                        className="w-4 h-4 mr-2"
                      />
                      Mit Google verbinden
                    </>
                  )}
                </Button>
                
                <div className="text-xs text-gray-500 space-y-1">
                  <p>Durch die Verbindung erhalten wir Zugriff auf:</p>
                  <ul className="text-left max-w-sm mx-auto">
                    <li>• Ihr Google Business Profil</li>
                    <li>• Grundlegende Kontoinformationen</li>
                    <li>• Berechtigung zur Profil-Bearbeitung</li>
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
                Onboarding abschließen
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">Was passiert als nächstes?</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Wir richten Ihr Google Business Profil ein</li>
          <li>• Ihre Unternehmensdaten werden übertragen</li>
          <li>• Sie erhalten Zugang zu Ihrem Dashboard</li>
          <li>• Die Synchronisation beginnt automatisch</li>
        </ul>
      </div>
    </div>
  );
};
