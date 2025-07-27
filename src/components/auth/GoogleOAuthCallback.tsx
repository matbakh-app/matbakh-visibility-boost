import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export function GoogleOAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');

        if (error) {
          throw new Error(`OAuth error: ${error}`);
        }

        if (!code || !state) {
          throw new Error('Missing authorization code or state');
        }

        // Parse state to get service type and user ID
        const [serviceType, userId] = state.split(':');
        
        if (!serviceType || !userId) {
          throw new Error('Invalid state parameter');
        }

        // Exchange authorization code for tokens
        const response = await supabase.functions.invoke('google-oauth-exchange', {
          body: {
            code,
            serviceType,
            userId,
            redirectUri: `${window.location.origin}/auth/google/callback`
          }
        });

        if (response.error) {
          throw new Error(response.error.message);
        }

        // Notify parent window of success
        if (window.opener) {
          window.opener.postMessage(
            { 
              type: 'GOOGLE_OAUTH_SUCCESS', 
              serviceType,
              data: response.data 
            },
            window.location.origin
          );
          window.close();
        } else {
          // If not in popup, redirect to dashboard
          toast({
            title: 'Erfolgreich verbunden',
            description: `Google ${serviceType} wurde erfolgreich verknüpft.`
          });
          navigate('/dashboard');
        }

      } catch (error) {
        console.error('OAuth callback error:', error);
        
        if (window.opener) {
          window.opener.postMessage(
            { 
              type: 'GOOGLE_OAUTH_ERROR', 
              error: error instanceof Error ? error.message : 'Unbekannter Fehler'
            },
            window.location.origin
          );
          window.close();
        } else {
          toast({
            title: 'Verbindung fehlgeschlagen',
            description: error instanceof Error ? error.message : 'Ein unbekannter Fehler ist aufgetreten.',
            variant: 'destructive'
          });
          navigate('/dashboard');
        }
      }
    };

    handleCallback();
  }, [searchParams, navigate, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
        <h2 className="text-lg font-semibold mb-2">Google-Verbindung wird hergestellt...</h2>
        <p className="text-sm text-muted-foreground">
          Bitte warten Sie, während wir Ihre Autorisierung verarbeiten.
        </p>
      </div>
    </div>
  );
}