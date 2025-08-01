// Phase 2: Google OAuth Callback Handler

import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type CallbackState = 'loading' | 'success' | 'error' | 'consent';

export default function GoogleCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  const [state, setState] = useState<CallbackState>('loading');
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');
  const [consentGiven, setConsentGiven] = useState({
    privacy: false,
    marketing: false,
    gmb: false
  });

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      // Check for OAuth errors
      const error = searchParams.get('error');
      const code = searchParams.get('code');
      
      if (error) {
        setState('error');
        setError(`OAuth Fehler: ${error}`);
        return;
      }

      if (!code) {
        setState('error');
        setError('Keine Autorisierung von Google erhalten');
        return;
      }

      // Process OAuth session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        setState('error');
        setError('Session-Fehler: ' + sessionError.message);
        return;
      }

      if (session?.user) {
        setUserEmail(session.user.email || '');
        setState('consent');
      } else {
        setState('error');
        setError('Benutzer-Session konnte nicht erstellt werden');
      }

    } catch (error) {
      console.error('Callback processing error:', error);
      setState('error');
      setError('Ein unerwarteter Fehler ist aufgetreten');
    }
  };

  const handleConsentSubmit = async () => {
    if (!consentGiven.privacy || !consentGiven.gmb) {
      toast({
        title: 'Zustimmung erforderlich',
        description: 'Bitte stimmen Sie den erforderlichen Punkten zu.',
        variant: 'destructive'
      });
      return;
    }

    try {
      // Store consent in user metadata
      const { error } = await supabase.auth.updateUser({
        data: {
          consent_privacy: consentGiven.privacy,
          consent_marketing: consentGiven.marketing,
          consent_gmb: consentGiven.gmb,
          consent_timestamp: new Date().toISOString()
        }
      });

      if (error) {
        toast({
          title: 'Fehler',
          description: 'Zustimmung konnte nicht gespeichert werden: ' + error.message,
          variant: 'destructive'
        });
        return;
      }

      setState('success');
      
      // Redirect to Google Enhanced Onboarding
      setTimeout(() => {
        navigate('/onboarding/google');
      }, 2000);

    } catch (error) {
      console.error('Consent submission error:', error);
      toast({
        title: 'Fehler',
        description: 'Ein Fehler ist beim Speichern aufgetreten',
        variant: 'destructive'
      });
    }
  };

  const renderContent = () => {
    switch (state) {
      case 'loading':
        return (
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
              <CardTitle>Google-Anmeldung wird verarbeitet...</CardTitle>
            </CardHeader>
            <CardContent className="text-center text-gray-600">
              Bitte warten Sie einen Moment.
            </CardContent>
          </Card>
        );

      case 'error':
        return (
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <XCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <CardTitle className="text-red-600">Anmeldung fehlgeschlagen</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-gray-600">{error}</p>
              <div className="flex flex-col gap-2">
                <Button onClick={() => navigate('/auth/google')}>
                  Erneut versuchen
                </Button>
                <Button variant="outline" onClick={() => navigate('/register')}>
                  Zurück zur Registrierung
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 'consent':
        return (
          <Card className="w-full max-w-lg">
            <CardHeader className="text-center">
              <Shield className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <CardTitle>Datenschutz & Einverständnis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-sm text-gray-600">
                <p className="mb-2">Angemeldet als: <strong>{userEmail}</strong></p>
                <p>Bitte bestätigen Sie Ihr Einverständnis:</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Checkbox 
                    id="privacy"
                    checked={consentGiven.privacy}
                    onCheckedChange={(checked) => 
                      setConsentGiven(prev => ({ ...prev, privacy: checked as boolean }))
                    }
                  />
                  <label htmlFor="privacy" className="text-sm font-medium">
                    Ich stimme der Datenschutzerklärung zu *
                    <span className="block text-xs text-gray-500 font-normal">
                      Erforderlich für die Nutzung der Plattform
                    </span>
                  </label>
                </div>

                <div className="flex items-start space-x-3">
                  <Checkbox 
                    id="gmb"
                    checked={consentGiven.gmb}
                    onCheckedChange={(checked) => 
                      setConsentGiven(prev => ({ ...prev, gmb: checked as boolean }))
                    }
                  />
                  <label htmlFor="gmb" className="text-sm font-medium">
                    Zugriff auf Google My Business Daten *
                    <span className="block text-xs text-gray-500 font-normal">
                      Erforderlich für automatische Profiloptimierung
                    </span>
                  </label>
                </div>

                <div className="flex items-start space-x-3">
                  <Checkbox 
                    id="marketing"
                    checked={consentGiven.marketing}
                    onCheckedChange={(checked) => 
                      setConsentGiven(prev => ({ ...prev, marketing: checked as boolean }))
                    }
                  />
                  <label htmlFor="marketing" className="text-sm font-medium">
                    Marketing-Nachrichten (optional)
                    <span className="block text-xs text-gray-500 font-normal">
                      Tipps und Updates zur Sichtbarkeitsoptimierung
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Button 
                  onClick={handleConsentSubmit}
                  disabled={!consentGiven.privacy || !consentGiven.gmb}
                  className="w-full"
                >
                  Zustimmen und fortfahren
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/register')}
                  className="w-full"
                >
                  Abbrechen
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 'success':
        return (
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <CardTitle className="text-green-600">Erfolgreich angemeldet!</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-gray-600">
                Sie werden automatisch zum Onboarding weitergeleitet...
              </p>
              <Loader2 className="w-6 h-6 animate-spin mx-auto" />
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      {renderContent()}
    </div>
  );
}