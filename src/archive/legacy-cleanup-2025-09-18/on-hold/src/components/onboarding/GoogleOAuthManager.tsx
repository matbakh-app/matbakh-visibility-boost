import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
// MIGRATED: Supabase removed - use AWS services
import { CheckCircle, XCircle, ExternalLink } from 'lucide-react';

interface GoogleService {
  id: 'gmb' | 'analytics' | 'ads';
  name: string;
  description: string;
  scopes: string[];
  isConnected: boolean;
  accountId?: string;
}

interface GoogleOAuthManagerProps {
  userId: string;
  onConnectionUpdate: () => void;
}

export function GoogleOAuthManager({ userId, onConnectionUpdate }: GoogleOAuthManagerProps) {
  const { toast } = useToast();
  const [connecting, setConnecting] = useState<string | null>(null);
  const [services, setServices] = useState<GoogleService[]>([
    {
      id: 'gmb',
      name: 'Google My Business',
      description: 'Verwalten Sie Ihr Unternehmensprofil und erhalten Sie Performance-Metriken',
      scopes: [
        'https://www.googleapis.com/auth/business.manage',
        'https://www.googleapis.com/auth/businessinfo'
      ],
      isConnected: false
    },
    {
      id: 'analytics',
      name: 'Google Analytics 4',
      description: 'Website-Traffic und Nutzerverhalten analysieren',
      scopes: [
        'https://www.googleapis.com/auth/analytics.readonly',
        'https://www.googleapis.com/auth/analytics.manage.users'
      ],
      isConnected: false
    },
    {
      id: 'ads',
      name: 'Google Ads',
      description: 'Werbekampagnen-Performance und Kosten tracken',
      scopes: [
        'https://www.googleapis.com/auth/adwords'
      ],
      isConnected: false
    }
  ]);

  const initiateGoogleOAuth = async (serviceType: 'gmb' | 'analytics' | 'ads') => {
    try {
      setConnecting(serviceType);

      const service = services.find(s => s.id === serviceType);
      if (!service) return;

      // Build OAuth URL with correct scopes for each service
      const params = new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        redirect_uri: `${window.location.origin}/auth/google/callback`,
        scope: service.scopes.join(' '),
        response_type: 'code',
        access_type: 'offline',
        prompt: 'consent',
        state: `${serviceType}:${userId}` // Include service type and user ID
      });

      const authUrl = `https://accounts.google.com/o/oauth2/auth?${params.toString()}`;
      
      // Open in popup window
      const popup = window.open(
        authUrl,
        'google-oauth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );

      // Listen for popup close or message
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          setConnecting(null);
          checkConnectionStatus();
        }
      }, 1000);

      // Listen for message from popup
      const messageHandler = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        
        if (event.data.type === 'GOOGLE_OAUTH_SUCCESS') {
          clearInterval(checkClosed);
          popup?.close();
          setConnecting(null);
          
          toast({
            title: 'Erfolgreich verbunden',
            description: `${service.name} wurde erfolgreich verknüpft.`
          });
          
          checkConnectionStatus();
          onConnectionUpdate();
        } else if (event.data.type === 'GOOGLE_OAUTH_ERROR') {
          clearInterval(checkClosed);
          popup?.close();
          setConnecting(null);
          
          toast({
            title: 'Verbindung fehlgeschlagen',
            description: event.data.error || 'Ein Fehler ist aufgetreten.',
            variant: 'destructive'
          });
        }
      };

      window.addEventListener('message', messageHandler);
      
      // Cleanup on unmount
      return () => {
        clearInterval(checkClosed);
        window.removeEventListener('message', messageHandler);
      };

    } catch (error) {
      console.error('OAuth initiation error:', error);
      setConnecting(null);
      toast({
        title: 'Fehler',
        description: 'OAuth-Flow konnte nicht gestartet werden.',
        variant: 'destructive'
      });
    }
  };

  const checkConnectionStatus = async () => {
    try {
      const { data: tokens, error } = await supabase
        .from('google_oauth_tokens')
        .select('service_type, gmb_account_id, ga4_property_id, ads_customer_id')
        .eq('user_id', userId as any);

      if (error) {
        console.error('Error checking connection status:', error);
        return;
      }

      setServices(prev => prev.map(service => {
        const token = tokens?.find(t => (t as any).service_type === service.id);
        return {
          ...service,
          isConnected: !!token,
          accountId: (token as any)?.gmb_account_id || (token as any)?.ga4_property_id || (token as any)?.ads_customer_id
        };
      }));

    } catch (error) {
      console.error('Error checking connection status:', error);
    }
  };

  const disconnectService = async (serviceType: string) => {
    try {
      const { error } = await supabase
        .from('google_oauth_tokens')
        .delete()
        .eq('user_id', userId as any)
        .eq('service_type', serviceType as any);

      if (error) throw error;

      toast({
        title: 'Verbindung getrennt',
        description: 'Der Service wurde erfolgreich getrennt.'
      });

      checkConnectionStatus();
      onConnectionUpdate();

    } catch (error) {
      console.error('Error disconnecting service:', error);
      toast({
        title: 'Fehler',
        description: 'Verbindung konnte nicht getrennt werden.',
        variant: 'destructive'
      });
    }
  };

  // Check connection status on component mount
  React.useEffect(() => {
    checkConnectionStatus();
  }, [userId]);

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Google Services verknüpfen</h3>
        <p className="text-sm text-muted-foreground">
          Verbinden Sie Ihre Google-Services für echte Leistungsdaten in Ihrer Sichtbarkeitsanalyse.
        </p>
      </div>

      {services.map((service) => (
        <Card key={service.id}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CardTitle className="text-base">{service.name}</CardTitle>
                <Badge variant={service.isConnected ? 'default' : 'secondary'}>
                  {service.isConnected ? (
                    <><CheckCircle className="w-3 h-3 mr-1" /> Verbunden</>
                  ) : (
                    <><XCircle className="w-3 h-3 mr-1" /> Nicht verbunden</>
                  )}
                </Badge>
              </div>
            </div>
            <CardDescription>{service.description}</CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {service.isConnected && service.accountId && (
                  <span>Account: {service.accountId}</span>
                )}
                {!service.isConnected && (
                  <span>Erforderliche Berechtigungen: {service.scopes.length} Scope(s)</span>
                )}
              </div>
              
              <div className="flex gap-2">
                {service.isConnected ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => disconnectService(service.id)}
                  >
                    Trennen
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => initiateGoogleOAuth(service.id)}
                    disabled={connecting === service.id}
                  >
                    {connecting === service.id ? (
                      'Verbinde...'
                    ) : (
                      <>
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Verbinden
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      <div className="mt-4 p-3 bg-muted rounded-lg">
        <p className="text-xs text-muted-foreground">
          <strong>Hinweis:</strong> Ihre Zugangsdaten werden sicher verschlüsselt gespeichert. 
          Sie können Verbindungen jederzeit trennen.
        </p>
      </div>
    </div>
  );
}