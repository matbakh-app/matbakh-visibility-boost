// Phase 2: Google OAuth Initiation Page

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Chrome } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function GoogleOAuth() {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Auto-initiate Google OAuth
    handleGoogleAuth();
  }, []);

  const handleGoogleAuth = async () => {
    try {
      // Google OAuth with enhanced scopes for GMB access
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          scopes: [
            'openid',
            'email',
            'profile',
            'https://www.googleapis.com/auth/business.manage',
            'https://www.googleapis.com/auth/business.manage.photos',
            'https://www.googleapis.com/auth/business.manage.reviews'
          ].join(' '),
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      });

      if (error) {
        console.error('Google OAuth error:', error);
        toast({
          title: 'OAuth Fehler',
          description: 'Google-Anmeldung konnte nicht gestartet werden. Bitte versuchen Sie es erneut.',
          variant: 'destructive'
        });
        
        // Fallback to manual registration
        setTimeout(() => {
          navigate('/register/email');
        }, 2000);
      }
    } catch (error) {
      console.error('OAuth initiation error:', error);
      toast({
        title: 'Fehler',
        description: 'Ein unerwarteter Fehler ist aufgetreten.',
        variant: 'destructive'
      });
      
      setTimeout(() => {
        navigate('/register');
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-blue-50 rounded-full flex items-center justify-center">
            <Chrome className="w-8 h-8 text-blue-600" />
          </div>
          <CardTitle className="text-xl font-semibold">
            Mit Google anmelden
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <div className="flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span className="text-gray-600">
              Sie werden zu Google weitergeleitet...
            </span>
          </div>
          
          <div className="text-sm text-gray-500 space-y-2">
            <p>Wir öffnen ein Google-Fenster für:</p>
            <ul className="text-xs space-y-1">
              <li>• Sichere Anmeldung</li>
              <li>• Google My Business Integration</li>
              <li>• Automatische Datenübernahme</li>
            </ul>
          </div>

          <div className="pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => navigate('/register')}
              className="w-full"
            >
              Zurück zur Registrierung
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}